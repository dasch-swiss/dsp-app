import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Constants } from '@dasch-swiss/dsp-js';
import { combineLatest, distinctUntilChanged, filter, map, Observable, switchMap } from 'rxjs';
import { IriLabelPair, OrderByItem, Predicate, StatementElement } from '../model';
import { buildStatementsFromFilterParams } from '../util/build-statements';
import { GravsearchService } from './gravsearch.service';
import { OntologyDataService } from './ontology-data.service';
import { SearchUrlSyncService, SearchUrlParams } from './search-url-sync.service';

/**
 * Derived, read-only view of the search form, computed purely from the URL (DEV-6576 Phase 2).
 *
 * This is the target "everything flows from the URL params" pipeline. It is built here to run
 * **in parallel** with the existing `SearchStateService`/`_applyParams` path; nothing consumes it
 * as the source of truth yet (that flip is Phase 3). It exposes:
 *   - `searchState$`  — { resourceClass, statements, orderByItems }, gated on ontology readiness
 *   - `orderByItems$` — pure order-by list derived from (confirmed statements, orderBy param)
 *   - `gravsearchQuery$` — the query string (or null), via the pure Phase-1 GravsearchService
 *   - `loading$`      — combined readiness (ontology + classes + predicates)
 */
export interface DerivedSearchState {
  resourceClass: IriLabelPair | null;
  statements: StatementElement[];
  orderByItems: OrderByItem[];
}

@Injectable()
export class SearchDerivationService {
  private readonly _urlSync = inject(SearchUrlSyncService);
  private readonly _ontology = inject(OntologyDataService);
  private readonly _gravsearch = inject(GravsearchService);
  private readonly _destroyRef = inject(DestroyRef);

  constructor() {
    this._reactToOntologyParam();
  }

  /**
   * Ontology-switch reaction (DEV-6576 Phase 3a). When the URL's `ontology` param names a different
   * ontology than the one currently loaded, trigger `setOntology` so `resourceClasses$`/predicates
   * re-hydrate and `loading$` settles. De-duped via `distinctUntilChanged` on the ontology param plus
   * the identity guard, so an unchanged ontology never reloads.
   *
   * This mirrors the imperative `_applyParamsWithOntologySwitch(+Obs)` in `filter-chip-bar` and is
   * additive: nothing consumes the derivation as the source of truth yet, so the imperative helpers
   * still run in parallel. Phase 3d deletes them once the page reads this pipeline — at which point
   * this reaction is the *only* thing switching the ontology from the URL.
   */
  private _reactToOntologyParam(): void {
    this._urlSync.params$
      .pipe(
        map(params => params.ontology),
        distinctUntilChanged(),
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
   * predicate list not yet hydrated. Mirrors what `_applyParams` waits on today.
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
      (a, b) => a.length === b.length && a.every((x, i) => x.id === b[i]?.id && x.orderBy === b[i]?.orderBy)
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
    const orderByItems = this._deriveOrderByItems(statements, params.orderBy);
    return { resourceClass, statements, orderByItems };
  }

  /**
   * Pure order-by derivation: one `OrderByItem` per confirmed statement's predicate, with the item
   * whose id matches the URL's `orderBy` param marked active. Non-sortable predicates (link / list)
   * are flagged disabled, mirroring `OrderByService`. Stale `orderBy` ids (not among the current
   * statements) simply produce no active item — the query then falls back to ASC(?label).
   */
  private _deriveOrderByItems(statements: StatementElement[], activeOrderById?: string): OrderByItem[] {
    const seen = new Set<string>();
    const items: OrderByItem[] = [];
    for (const stmt of statements) {
      const pred = stmt.selectedPredicate;
      if (!pred || !stmt.isValidAndComplete || seen.has(pred.iri)) continue;
      seen.add(pred.iri);
      const disabled = pred.isLinkProperty || pred.objectValueType === Constants.ListValue;
      items.push(new OrderByItem(pred.iri, pred.labels, disabled, pred.iri === activeOrderById));
    }
    return items;
  }
}
