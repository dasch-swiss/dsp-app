import { Provider } from '@angular/core';
import { provideSearchFilters, SearchFilterState } from '@dasch-swiss/vre/pages/search/search-filters';
import { DerivedSearchStateService } from './service/derived-search-state.service';
import { SearchUrlSyncService } from './service/search-url-sync.service';

/**
 * The Search tab's wiring: the shared filter stack, plus this page's answer to where search state lives
 * — all six parameters in the URL — and the derivation it builds on top (sorting by a filter's
 * predicate, and the query assembled from those parameters).
 */
export function provideAdvancedSearch(): Provider[] {
  return [
    ...provideSearchFilters(),
    SearchUrlSyncService,
    { provide: SearchFilterState, useExisting: SearchUrlSyncService },
    DerivedSearchStateService,
  ];
}
