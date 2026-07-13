import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { UserService } from '@dasch-swiss/vre/core/session';
import { TranslateLoader, TranslateModule, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { IriLabelPair, OrderByItem } from './model';
import { DerivedSearchStateService } from './service/derived-search-state.service';
import { OntologyDataService } from './service/ontology-data.service';
import { SearchFlowLogger } from './service/search-flow-logger.service';
import { SearchUrlSyncService } from './service/search-url-sync.service';
import { StatementDraftStore } from './service/statement-draft.store';
import { toLabels } from './util/labels';

const searchUrlSyncServiceStub = {
  provide: SearchUrlSyncService,
  useValue: {
    // The URL-derived pipeline (DerivedSearchStateService) subscribes to `params$` on construction, so
    // stories that provide the real services need it to emit at least once.
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
    urlRead: () => {},
    urlWrite: () => {},
    urlClear: () => {},
    fulltextChanged: () => {},
    filterConfirmed: () => {},
    filterRemoved: () => {},
    searchStart: () => {},
    searchSuccess: () => {},
    searchError: () => {},
  } as Partial<SearchFlowLogger>,
};

// Static English translations for Storybook, mirroring the app's en.json `pages.search.advancedSearch`
// namespace so the `translate` pipe renders the real UI text (not the raw key) in stories and their
// play() assertions. Keep in sync with apps/dsp-app/src/assets/i18n/en.json.
const STORY_TRANSLATIONS = {
  pages: {
    search: {
      advancedSearch: {
        allResourceClasses: 'All resources',
        dataModel: 'Data model',
        orderBy: 'Sort by',
        property: 'Property',
        propertyOfClass: 'Property of {{class}}',
        resourceClass: 'Resource Class',
        fulltextSearch: 'Search in all text fields',
        reset: 'Reset',
        addFilter: 'Add filter',
        add: 'Add',
        operator: 'Operator',
        noResultsFound:
          "We couldn't find any resources matching your search criteria. Try adjusting your search parameters.",
        resultsTitle: 'Advanced search results',
        searchForResource: 'Search for a resource',
        noResourcesFound: 'No resources found for "{{term}}"',
        typeToSearch: 'Type at least 3 characters to search',
        loadingResources: 'Loading resources...',
        showingResults: 'Showing {{count}} results of {{total}}',
        valueLabels: {
          label: "Label's value",
          text: 'Text Value',
          boolean: 'Value',
          uri: 'URI Value',
          integer: 'Integer Value',
          decimal: 'Decimal Value',
          true: 'True',
          false: 'False',
        },
        errors: {
          uri: 'Value must be a URI value.',
          integer: 'Value must be an integer value.',
          decimal: 'Value must be a decimal value.',
        },
        tooltips: {
          addCriteria: 'Add search criteria',
          addSubCriteria: 'Add sub-criteria',
          clearResourceClass: 'Clear resource class',
          orderByDisabled: 'Search cannot be ordered by a URI property or a property that links to a resource.',
          removeCriteria: 'Remove search criteria',
          removeFilter: 'Remove filter',
          removeSubcriteria: 'Remove sub-criteria',
          sortAscending: 'Sorted ascending — click for descending',
          sortDescending: 'Sorted descending — click for ascending',
        },
      },
    },
  },
};

class StoryTranslateLoader implements TranslateLoader {
  getTranslation(): Observable<TranslationObject> {
    return of(STORY_TRANSLATIONS);
  }
}

export const STORY_PROVIDERS = [
  provideAnimations(),
  provideRouter([{ path: '**', redirectTo: '' }]),
  importProvidersFrom(
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: { provide: TranslateLoader, useClass: StoryTranslateLoader },
    })
  ),
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

/**
 * Stub for the URL-derived order-by list. `OrderByComponent` reads `orderByItems$` from
 * `DerivedSearchStateService` and writes via `SearchUrlSyncService` (stubbed no-op in
 * `STORY_PROVIDERS`), so stories drive the list from here.
 */
export const makeDerivedSearchStateServiceStub = (
  partial: Partial<DerivedSearchStateService> = {}
): Partial<DerivedSearchStateService> => ({
  orderByItems$: of([] as OrderByItem[]),
  // StatementDraftStore seeds its store from searchState$ on construction, so every story that provides
  // the real store needs this to emit at least once.
  searchState$: of({ resourceClass: null, statements: [], orderByItems: [] }),
  loading$: of(false),
  gravsearchQuery$: of(null),
  ...partial,
});

/** Convenience provider pairing the manager with a derivation stub — for chip stories that edit filters. */
export const PROPERTY_FORM_MANAGER_STORY_PROVIDERS = [
  { provide: DerivedSearchStateService, useValue: makeDerivedSearchStateServiceStub() },
  StatementDraftStore,
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
