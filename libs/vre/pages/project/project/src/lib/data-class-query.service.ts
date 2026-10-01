import { inject, Injectable } from '@angular/core';
import {
  ConfirmedSearchStateService,
  GravsearchService,
  SearchFilterState,
} from '@dasch-swiss/vre/pages/search/search-filters';
import { combineLatest, distinctUntilChanged, filter, map, Observable, shareReplay } from 'rxjs';
import { DataClassUrlStateService } from './data-class-url-state.service';

/**
 * The Data tab's Gravsearch query, derived from the URL.
 *
 * This is the page's answer to advanced search's `DerivedSearchStateService.gravsearchQuery$`, and
 * it differs from it in one structural way: **the query is never null.** On the Search tab an empty
 * form means "nothing to search" and the results pane stays blank; here the route already fixes a
 * resource class, so an unfiltered class view is a legitimate query that must list everything in
 * the class. Filters and a fulltext term only narrow it.
 *
 * Component scoped — provided by the class view so the header and the list read one instance and a
 * class switch disposes it.
 */
@Injectable()
export class DataClassQueryService {
  private readonly _confirmed = inject(ConfirmedSearchStateService);
  private readonly _urlState = inject(DataClassUrlStateService);
  private readonly _gravsearch = inject(GravsearchService);

  /**
   * Emits once the route's class has resolved against the loaded ontology, and on every subsequent
   * change to filters, term or sort.
   *
   * Gating on a resolved `resourceClass` rather than on the raw route IRI is deliberate: the IRI is
   * known immediately but the ontology that gives it meaning is not, and querying in between would
   * send a request with an empty class anchor that matches every resource in the project.
   *
   * `shareReplay` because both the result request and the count request subscribe, and the two must
   * see the same query string — recomputing per subscriber would be harmless today but would make a
   * future impure input (a timestamp, a nonce) diverge the pair silently.
   *
   * `refCount: false` so the last query survives a gap in subscribers. Retry tears the request chain
   * down and rebuilds it; under `refCount: true` that would drop the replay buffer and leave retry
   * waiting on the upstream to re-emit. The subscription it holds open is bounded by this service's
   * own lifetime, which is the class view's.
   */
  readonly query$: Observable<string> = combineLatest([
    this._confirmed.confirmedState$,
    this._urlState.fulltextTerm$,
    this._urlState.orderByItems$,
  ]).pipe(
    filter(([state]) => !!state.resourceClass?.iri),
    map(([state, fulltextTerm, orderByItems]) =>
      this._gravsearch.generateGravSearchQuery(
        // An incomplete row is a filter the user is still editing. The bar only confirms complete
        // ones, but a hand-edited URL can carry a half-filter, and it must not narrow the results.
        state.statements.filter(s => s.isValidAndComplete),
        fulltextTerm,
        state.resourceClass?.iri ?? '',
        orderByItems
      )
    ),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: false })
  );
}

/**
 * The page provides its URL state under both its own type and the shared port: the chip bar and
 * `ConfirmedSearchStateService` resolve `SearchFilterState`, while this service and the sort header
 * need the Data-tab-only members (`sortDescending$`, `setSortDescending`, `orderByItems$`) that the
 * port does not declare. `useExisting` keeps both names pointing at one instance.
 */
export function provideDataClassSearch() {
  return [
    DataClassUrlStateService,
    { provide: SearchFilterState, useExisting: DataClassUrlStateService },
    DataClassQueryService,
  ];
}
