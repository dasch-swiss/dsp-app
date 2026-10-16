import { Observable } from 'rxjs';
import { FilterParam } from './filter-params.codec';

/**
 * What the chip bar needs from its host page, and nothing more.
 *
 * The bar is shared between the Search tab and the project Data tab, which disagree about how search
 * state is *stored*: the Search tab carries the data model and resource class as query params and sorts
 * by an arbitrary predicate, while the Data tab takes both from the route path and sorts by label only.
 * Those are genuine differences, not accidents, so the bar depends on this port rather than on any one
 * page's URL service. A page implementing it decides which parameters exist, when they are written, what
 * counts as "active", and how much history a change pushes.
 *
 * What is *not* page-local: the meaning of a filter. The encoded `FilterParam[]` crossing this boundary
 * uses the shared codec, so a link copied out of one page denotes the same filter when opened on another.
 */
export abstract class SearchFilterState {
  /** Confirmed filters, already decoded. Unconfirmed drafts live in `StatementDraftStore`, not here. */
  abstract readonly filters$: Observable<FilterParam[]>;

  /** The general fulltext term, or `''` when unset. */
  abstract readonly fulltextTerm$: Observable<string>;

  /** Ontology the search is scoped to. The Search tab reads a query param; the Data tab, the route. */
  abstract readonly ontologyIri$: Observable<string | undefined>;

  /** Resource class the search is scoped to, or `undefined` for "all classes". */
  abstract readonly resourceClassIri$: Observable<string | undefined>;

  /** Drives the Reset control. Each page decides what counts — the Data tab includes its sort direction. */
  abstract readonly hasActiveState$: Observable<boolean>;

  abstract setFulltextTerm(term: string | undefined): void;

  /**
   * Persist the confirmed filter set.
   *
   * `removedPredicateIri` names the predicate of a filter the user just deleted, so a page that sorts by
   * a filter's predicate can drop a now-orphaned sort in the *same* navigation — two synchronous router
   * navigations get coalesced and the second discards the first. Pages that do not sort by predicate
   * (the Data tab sorts by label only) ignore it.
   */
  abstract setFilters(filters: FilterParam[], removedPredicateIri?: string): void;

  /** Clear everything this page considers search state, in one navigation. */
  abstract reset(): void;
}
