import { inject, Injectable } from '@angular/core';
import {
  ConfirmedSearchStateService,
  GravsearchService,
  SearchFilterState,
} from '@dasch-swiss/vre/pages/search/search-filters';
import { combineLatest, distinctUntilChanged, filter, map, Observable, shareReplay } from 'rxjs';
import { DataClassUrlStateService } from './data-class-url-state.service';

/**
 * The Data tab's Gravsearch query, derived from the URL. Unlike advanced search's
 * `gravsearchQuery$` it is never null: the route fixes the class, so an unfiltered view must list
 * everything in it. Component scoped, provided by the class view.
 */
@Injectable()
export class DataClassQueryService {
  private readonly _confirmed = inject(ConfirmedSearchStateService);
  private readonly _urlState = inject(DataClassUrlStateService);
  private readonly _gravsearch = inject(GravsearchService);

  /**
   * Emits once the route's class has resolved against the loaded ontology, then on every change to
   * filters, term or sort. Gated on the resolved class, not the route IRI: querying earlier would
   * send an empty class anchor that matches every resource in the project.
   *
   * `shareReplay` keeps the result and count requests on the same query string. `refCount: false`
   * because retry tears the request chain down and must still find the last query.
   */
  readonly query$: Observable<string> = combineLatest([
    this._confirmed.confirmedState$,
    this._urlState.fulltextTerm$,
    this._urlState.orderByItems$,
  ]).pipe(
    filter(([state]) => !!state.resourceClass?.iri),
    map(([state, fulltextTerm, orderByItems]) =>
      this._gravsearch.generateGravSearchQuery(
        // A hand-edited URL can carry an incomplete filter; it must not narrow the results.
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
 * Provides the URL state under both its own type and the shared `SearchFilterState` port, as one
 * instance: this service and the sort header need Data-tab-only members the port does not declare.
 */
export function provideDataClassSearch() {
  return [
    DataClassUrlStateService,
    { provide: SearchFilterState, useExisting: DataClassUrlStateService },
    DataClassQueryService,
  ];
}
