import { inject, Injectable } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import { combineLatest, distinctUntilChanged, map, Observable } from 'rxjs';
import { IriLabelPair, OrderByItem, OrderDirection, StatementElement } from '../model';
import { ConfirmedSearchStateService } from './confirmed-search-state.service';
import { GravsearchService } from './gravsearch.service';
import { OntologyDataService } from './ontology-data.service';
import { SearchUrlSyncService } from './search-url-sync.service';

/**
 * The Search tab's own derivation on top of the shared confirmed state.
 *
 * Hydration and the ontology-switch reaction are page-agnostic and live in
 * {@link ConfirmedSearchStateService}. What remains here is specific to this page: sorting by a
 * *filter's predicate*, and assembling the query from all six URL params. It exposes:
 *   - `searchState$`  — { resourceClass, statements, orderByItems }, gated on ontology readiness
 *   - `orderByItems$` — pure order-by list derived from (confirmed statements, orderBy param)
 *   - `gravsearchQuery$` — the query string (or null), via the pure GravsearchService
 *   - `loading$`      — combined readiness (ontology + classes + predicates)
 */
export interface DerivedSearchState {
  resourceClass: IriLabelPair | null;
  statements: StatementElement[];
  orderByItems: OrderByItem[];
}

@Injectable()
export class DerivedSearchStateService {
  private readonly _urlSync = inject(SearchUrlSyncService);
  private readonly _ontology = inject(OntologyDataService);
  private readonly _gravsearch = inject(GravsearchService);
  private readonly _confirmed = inject(ConfirmedSearchStateService);

  /**
   * Combined readiness gate. True while any source needed to hydrate the URL is not yet available:
   * ontology still loading, resource classes not yet emitted, or (for a filter-bearing URL) the
   * predicate list not yet hydrated.
   */
  readonly loading$: Observable<boolean> = combineLatest([
    this._urlSync.params$,
    this._ontology.ontologyLoading$,
    this._ontology.resourceClasses$,
    this._ontology.getProperties$(),
  ]).pipe(
    map(([params, ontologyLoading, classes, predicates]) => {
      if (ontologyLoading) return true;
      if (classes.length === 0) return true;
      // A filter-bearing URL needs predicates hydrated (getProperties$ always emits at least the
      // synthetic rdfs:label; treat "only that seed" as not-yet-ready when filters are present).
      if (params.filters && predicates.length <= 1) return true;
      return false;
    }),
    distinctUntilChanged()
  );

  /**
   * Hydrated search state, emitted only once the readiness gate is open. The resource class and
   * statements come from the shared confirmed state; this page adds the order-by list, which it derives
   * from the confirmed statements' predicates.
   */
  readonly searchState$: Observable<DerivedSearchState> = combineLatest([
    this._confirmed.confirmedState$,
    this._urlSync.params$,
  ]).pipe(
    map(([confirmed, params]) => ({
      resourceClass: confirmed.resourceClass,
      statements: confirmed.statements,
      orderByItems: this._deriveOrderByItems(confirmed.statements, params.orderBy, params.orderDir),
    }))
  );

  /** Pure order-by list: available (sortable-aware) predicates with the URL's active id marked. */
  readonly orderByItems$: Observable<OrderByItem[]> = this.searchState$.pipe(
    map(state => state.orderByItems),
    distinctUntilChanged(
      (a, b) =>
        a.length === b.length &&
        a.every((x, i) => x.id === b[i]?.id && x.orderBy === b[i]?.orderBy && x.direction === b[i]?.direction)
    )
  );

  /** The Gravsearch query string derived from the URL, or null when there is nothing to search. */
  readonly gravsearchQuery$: Observable<string | null> = combineLatest([this.searchState$, this._urlSync.params$]).pipe(
    map(([state, params]) => {
      const fulltext = params.q ?? '';
      const validStatements = state.statements.filter(s => s.isValidAndComplete);
      const hasResourceClass = !!state.resourceClass?.iri;
      if (!fulltext && validStatements.length === 0 && !hasResourceClass) {
        return null;
      }
      return this._gravsearch.generateGravSearchQuery(
        validStatements,
        fulltext,
        state.resourceClass?.iri ?? '',
        state.orderByItems
      );
    }),
    distinctUntilChanged()
  );

  /**
   * Pure order-by derivation: one `OrderByItem` per confirmed statement's predicate, with the item
   * whose id matches the URL's `orderBy` param marked active and carrying its `orderDir` direction
   * (defaulting to ascending). Non-sortable predicates (link / list) are flagged disabled. Stale
   * `orderBy` ids (not among the current statements) simply produce no active item — the query then
   * falls back to ASC(?label).
   */
  private _deriveOrderByItems(
    statements: StatementElement[],
    activeOrderById?: string,
    activeDirection?: OrderDirection
  ): OrderByItem[] {
    const seen = new Set<string>();
    const items: OrderByItem[] = [];
    for (const stmt of statements) {
      const pred = stmt.selectedPredicate;
      if (!pred || !stmt.isValidAndComplete || seen.has(pred.iri)) continue;
      seen.add(pred.iri);
      const disabled = pred.isLinkProperty || pred.objectValueType === Constants.ListValue;
      const isActive = pred.iri === activeOrderById;
      items.push(
        new OrderByItem(pred.iri, pred.labels, disabled, isActive, isActive ? (activeDirection ?? 'asc') : 'asc')
      );
    }
    return items;
  }
}
