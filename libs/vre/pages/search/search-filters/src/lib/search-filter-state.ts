import { Observable } from 'rxjs';
import { FilterParam } from './filter-params.codec';

/**
 * What the chip bar needs from its host page. Pages store search state differently (the Search tab in query
 * params, the Data tab in the route path), so the bar depends on this port, not on a page's URL service. The
 * `FilterParam[]` crossing it uses the shared codec.
 */
export abstract class SearchFilterState {
  /** Confirmed filters, already decoded. Unconfirmed drafts live in `StatementDraftStore`, not here. */
  abstract readonly filters$: Observable<FilterParam[]>;

  /** The general fulltext term, or `''` when unset. */
  abstract readonly fulltextTerm$: Observable<string>;

  /** Ontology the search is scoped to. */
  abstract readonly ontologyIri$: Observable<string | undefined>;

  /** Resource class the search is scoped to, or `undefined` for "all classes". */
  abstract readonly resourceClassIri$: Observable<string | undefined>;

  /** Drives the Reset control. Each page decides what counts — the Data tab includes its sort direction. */
  abstract readonly hasActiveState$: Observable<boolean>;

  abstract setFulltextTerm(term: string | undefined): void;

  /**
   * Persist the confirmed filter set. `removedPredicateIri` is the predicate of a just-deleted filter, so a page
   * sorting by predicate can drop the orphaned sort in the same navigation; other pages ignore it.
   */
  abstract setFilters(filters: FilterParam[], removedPredicateIri?: string): void;

  /** Clear everything this page considers search state, in one navigation. */
  abstract reset(): void;
}
