import { of } from 'rxjs';
// eslint-disable-next-line no-restricted-imports -- story-only helpers, kept out of search-filters' barrel.
import {
  EMPTY_SEARCH_STATE,
  STORY_PROVIDERS as SHARED_STORY_PROVIDERS,
} from '../../../search-filters/src/lib/stories.helpers';
import { DerivedSearchStateService } from './service/derived-search-state.service';
import { SearchUrlSyncService } from './service/search-url-sync.service';

// eslint-disable-next-line no-restricted-imports -- story-only helpers, kept out of search-filters' barrel.
export {
  EMPTY_SEARCH_STATE,
  makeDspApiConnectionStub,
  makeOntologyDataServiceStub,
  SAMPLE_ONTOLOGIES,
  SAMPLE_RESOURCE_CLASSES,
} from '../../../search-filters/src/lib/stories.helpers';

/** Stubs the Search tab's URL service on top of the shared port stub, both backed by one quiet state object. */
const searchUrlSyncServiceStub = {
  provide: SearchUrlSyncService,
  useValue: EMPTY_SEARCH_STATE as Partial<SearchUrlSyncService>,
};

export const STORY_PROVIDERS = [...SHARED_STORY_PROVIDERS, searchUrlSyncServiceStub];

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
