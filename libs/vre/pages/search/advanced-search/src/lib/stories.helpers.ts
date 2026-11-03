import {
  EMPTY_SEARCH_STATE,
  SEARCH_FILTER_SERVICE_STUBS,
  STORY_PROVIDERS as SHARED_STORY_PROVIDERS,
} from '@dasch-swiss/vre/pages/search/search-filters';
import { of } from 'rxjs';
import { DerivedSearchStateService } from './service/derived-search-state.service';
import { SearchUrlSyncService } from './service/search-url-sync.service';

export {
  CHIP_LABEL_STORY_PROVIDERS,
  makeDspApiConnectionStub,
  makeListNodeLabelResolverStub,
  makeOntologyDataServiceStub,
  PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
  SAMPLE_ONTOLOGIES,
  SAMPLE_RESOURCE_CLASSES,
} from '@dasch-swiss/vre/pages/search/search-filters';

/** Stubs the Search tab's URL service on top of the shared port stub, both backed by one quiet state object. */
const searchUrlSyncServiceStub = {
  provide: SearchUrlSyncService,
  useValue: EMPTY_SEARCH_STATE as Partial<SearchUrlSyncService>,
};

export const STORY_PROVIDERS = [...SHARED_STORY_PROVIDERS, searchUrlSyncServiceStub];

/** Use these AFTER provideAdvancedSearch() to override the real services with story-safe stubs. */
export const ADVANCED_SEARCH_SERVICE_STUBS = [...SEARCH_FILTER_SERVICE_STUBS, searchUrlSyncServiceStub];

/**
 * Stub for the URL-derived order-by list. `OrderByComponent` reads `orderByItems$` from
 * `DerivedSearchStateService` and writes via `SearchUrlSyncService` (stubbed no-op above), so stories
 * drive the list from here.
 */
export const makeDerivedSearchStateServiceStub = (
  partial: Partial<DerivedSearchStateService> = {}
): Partial<DerivedSearchStateService> => ({
  orderByItems$: of([]),
  searchState$: of({ resourceClass: null, statements: [], orderByItems: [] }),
  loading$: of(false),
  gravsearchQuery$: of(null),
  ...partial,
});
