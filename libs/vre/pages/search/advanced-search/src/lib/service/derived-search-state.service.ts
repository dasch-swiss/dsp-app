import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Constants } from '@dasch-swiss/dsp-js';
import { combineLatest, distinctUntilChanged, filter, map, Observable, switchMap } from 'rxjs';
import { IriLabelPair, OrderByItem, OrderDirection, Predicate, StatementElement } from '../model';
import { buildStatementsFromFilterParams } from '../util/build-statements';
import { GravsearchService } from './gravsearch.service';
import { OntologyDataService } from './ontology-data.service';
import { SearchUrlSyncService, SearchUrlParams } from './search-url-sync.service';

/**
 * Derived, read-only view of the search form, computed purely from the URL.
 *
 * The URL query params are the single source of truth; everything the search UI reads flows from
 * here. First load, back/forward, and user actions all go through the same derivation. It exposes:
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
  private readonly _destroyRef = inject(DestroyRef);

  constructor() {
    this._reactToOntologyParam();
  }

  /**
   * Ontology-switch reaction. Keeps the loaded ontology in sync with the URL's `ontology` param:
   *   - a non-empty param names the ontology to load;
   *   - an empty param (no `ontology` in the URL, e.g. after Reset) falls back to the project default,
   *     so the Data Model chip reverts instead of staying stuck on a previously chosen ontology.
   * `setOntology` re-hydrates `resourceClasses$`/predicates and lets `loading$` settle. De-duped via
   * `distinctUntilChanged` on the param plus an identity guard against the currently-loaded ontology,
   * so an unchanged target never reloads. This is the only thing that switches the ontology from the URL.
   */
  private _reactToOntologyParam(): void {
    this._urlSync.params$
      .pipe(
        map(params => params.ontology),
        distinctUntilChanged(),
        map(ontologyIri => ontologyIri || this._ontology.defaultOntologyIri),
        filter(
          (ontologyIri): ontologyIri is string => !!ontologyIri && ontologyIri !== this._ontology.selectedOntology.iri
        ),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(ontologyIri => this._ontology.setOntology(ontologyIri));
  }

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

  /** Hydrated search state, emitted only once the readiness gate is open. */
  readonly searchState$: Observable<DerivedSearchState> = this._urlSync.params$.pipe(
    switchMap(params =>
      combineLatest([this._ontology.resourceClasses$, this._ontology.getProperties$()]).pipe(
        // Wait until the sources needed for THIS url are ready, then hydrate once.
        map(([classes, predicates]) => ({ params, classes, predicates })),
        distinctUntilChanged(
          (a, b) => a.params === b.params && a.classes === b.classes && a.predicates === b.predicates
        ),
        map(({ classes, predicates }) => this._hydrate(params, classes, predicates))
      )
    )
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

  private _hydrate(params: SearchUrlParams, classes: IriLabelPair[], predicates: Predicate[]): DerivedSearchState {
    const resourceClass = params.class ? (classes.find(c => c.iri === params.class) ?? null) : null;
    const statements = params.filters
      ? buildStatementsFromFilterParams(this._urlSync.decodeFilters(params.filters), predicates)
      : [];
    const orderByItems = this._deriveOrderByItems(statements, params.orderBy, params.orderDir);
    return { resourceClass, statements, orderByItems };
  }

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
