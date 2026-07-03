import { signal } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { UserService } from '@dasch-swiss/vre/core/session';
import { EMPTY, of } from 'rxjs';
import { IriLabelPair, OrderByItem } from './model';
import { OntologyDataService } from './service/ontology-data.service';
import { PropertyFormManager } from './service/property-form.manager';
import { QueryExecutionService } from './service/query-execution.service';
import { SearchDerivationService } from './service/search-derivation.service';
import { SearchFlowLogger } from './service/search-flow-logger.service';
import { SearchUrlSyncService } from './service/search-url-sync.service';
import { toLabels } from './util/labels';

const searchUrlSyncServiceStub = {
  provide: SearchUrlSyncService,
  useValue: {
    popstate$: EMPTY,
    // The URL-derived pipeline (SearchDerivationService) subscribes to `params$` on construction, so
    // stories that provide the real services need it to emit at least once (DEV-6576 Phase 3).
    params$: of({}),
    readParams: () => ({}),
    writeState: () => {},
    clearAll: () => {},
    encodeFilters: () => '',
    decodeFilters: () => [],
  } as Partial<SearchUrlSyncService>,
};

const searchFlowLoggerStub = {
  provide: SearchFlowLogger,
  useValue: {
    ontologyReady: () => {},
    fulltextChanged: () => {},
    filterConfirmed: () => {},
    filterRemoved: () => {},
    stateReset: () => {},
    applyParams: () => {},
    filtersRestored: () => {},
    emitSearch: () => {},
    queryNull: () => {},
    queryGenerated: () => {},
    searchStart: () => {},
    searchSuccess: () => {},
    searchError: () => {},
    popstate: () => {},
    urlRead: () => {},
    urlWrite: () => {},
    urlClear: () => {},
  } as Partial<SearchFlowLogger>,
};

export const STORY_PROVIDERS = [
  provideAnimations(),
  provideRouter([{ path: '**', redirectTo: '' }]),
  { provide: UserService, useValue: { currentUser: null } as Partial<UserService> },
  searchUrlSyncServiceStub,
  searchFlowLoggerStub,
];

/** Use these AFTER provideAdvancedSearch() to override the real services with story-safe stubs. */
export const ADVANCED_SEARCH_SERVICE_STUBS = [searchUrlSyncServiceStub, searchFlowLoggerStub];

export const SAMPLE_ONTOLOGIES: IriLabelPair[] = [
  { iri: 'http://0.0.0.0:3333/ontology/0001/test/v2', labels: toLabels('Test Ontology'), comments: [] },
  { iri: 'http://0.0.0.0:3333/ontology/0001/images/v2', labels: toLabels('Images Ontology'), comments: [] },
];

export const SAMPLE_RESOURCE_CLASSES: IriLabelPair[] = [
  { iri: 'http://0.0.0.0:3333/ontology/0001/test/v2#Book', labels: toLabels('Book'), comments: [] },
  { iri: 'http://0.0.0.0:3333/ontology/0001/test/v2#Person', labels: toLabels('Person'), comments: [] },
];

export const makeOntologyDataServiceStub = (
  partial: Partial<OntologyDataService> = {}
): Partial<OntologyDataService> => ({
  ontologies$: of(SAMPLE_ONTOLOGIES),
  selectedOntology$: of({ id: SAMPLE_ONTOLOGIES[0].iri, label: SAMPLE_ONTOLOGIES[0].labels[0].value } as any),
  ontologyLoading$: of(false),
  resourceClasses$: of(SAMPLE_RESOURCE_CLASSES),
  selectedOntology: SAMPLE_ONTOLOGIES[0],
  classIris: [],
  init: () => {},
  setOntology: () => {},
  getProperties$: () => of([]),
  getResourceClassObjectsForProperty$: () => of(SAMPLE_RESOURCE_CLASSES),
  getSubclassesOfResourceClass$: () => of([]),
  ...partial,
});

export const makeQueryExecutionServiceStub = (
  partial: { queryIsExecuting?: boolean } = {}
): Partial<QueryExecutionService> => ({
  queryIsExecuting: signal(partial.queryIsExecuting ?? false),
});

/**
 * Stub for the URL-derived order-by list (DEV-6576 Phase 3b). `OrderByComponent` now reads
 * `orderByItems$` from `SearchDerivationService` and writes via `SearchUrlSyncService` (stubbed no-op
 * in `STORY_PROVIDERS`), so stories drive the list from here.
 */
export const makeSearchDerivationServiceStub = (
  partial: Partial<SearchDerivationService> = {}
): Partial<SearchDerivationService> => ({
  orderByItems$: of([] as OrderByItem[]),
  // PropertyFormManager seeds its store from searchState$ on construction, so every story that provides
  // the real manager needs this to emit at least once (DEV-6576 Phase 3.5).
  searchState$: of({ resourceClass: null, statements: [], orderByItems: [] }),
  loading$: of(false),
  gravsearchQuery$: of(null),
  ...partial,
});

/** Convenience provider pairing the manager with a derivation stub — for chip stories that edit filters. */
export const PROPERTY_FORM_MANAGER_STORY_PROVIDERS = [
  { provide: SearchDerivationService, useValue: makeSearchDerivationServiceStub() },
  PropertyFormManager,
];

export const makeDspApiConnectionStub = (partial: Record<string, unknown> = {}) => ({
  v2: {
    onto: {
      getOntologiesByProjectIri: () => of({ ontologies: [] }),
      getOntology: () => of({ id: SAMPLE_ONTOLOGIES[0].iri, label: SAMPLE_ONTOLOGIES[0].labels[0].value }),
    },
    search: {
      doFulltextSearch: () => of({ resources: [] }),
      doFulltextSearchCountQuery: () => of({ numberOfResults: 0 }),
      doExtendedSearch: () => of({ resources: [] }),
      doExtendedSearchCountQuery: () => of({ numberOfResults: 0 }),
    },
    ...partial,
  },
});
