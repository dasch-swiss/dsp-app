import { Provider } from '@angular/core';
import { provideSearchFilters, SearchFilterState } from '@dasch-swiss/vre/pages/search/search-filters';
import { DerivedSearchStateService } from './service/derived-search-state.service';
import { SearchUrlSyncService } from './service/search-url-sync.service';

/** The Search tab's providers: the shared filter stack plus URL-backed search state. */
export function provideAdvancedSearch(): Provider[] {
  return [
    ...provideSearchFilters(),
    SearchUrlSyncService,
    { provide: SearchFilterState, useExisting: SearchUrlSyncService },
    DerivedSearchStateService,
  ];
}
