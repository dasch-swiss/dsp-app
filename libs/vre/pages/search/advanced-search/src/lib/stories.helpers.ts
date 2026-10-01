import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { UserService } from '@dasch-swiss/vre/core/session';
import { TranslateLoader, TranslateModule, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { IriLabelPair, OrderByItem } from './model';
import { SearchFilterState } from './search-filter-state';
import { DerivedSearchStateService } from './service/derived-search-state.service';
import { ListNodeLabelResolver } from './service/list-node-label.resolver';
import { OntologyDataService } from './service/ontology-data.service';
import { SearchFlowLogger } from './service/search-flow-logger.service';
import { SearchUrlSyncService } from './service/search-url-sync.service';
import { StatementDraftStore } from './service/statement-draft.store';
import { toLabels } from './util/labels';

/**
 * A quiet search state: no filters, no term, nothing active. Satisfies both the `SearchUrlSyncService`
 * surface (for the Search tab's own derivation) and the `SearchFilterState` port the chip bar reads.
 * Every stream must emit at least once — the derivation and the bar subscribe on construction.
 */
const emptySearchState = {
  params$: of({}),
  readParams: () => ({}),
  writeState: () => {},
  clearAll: () => {},
  encodeFilters: () => '',
  decodeFilters: () => [],
  filters$: of([]),
  fulltextTerm$: of(''),
  ontologyIri$: of(undefined),
  resourceClassIri$: of(undefined),
  hasActiveState$: of(false),
  setFulltextTerm: () => {},
  setFilters: () => {},
  reset: () => {},
};

const searchUrlSyncServiceStub = {
  provide: SearchUrlSyncService,
  useValue: emptySearchState as Partial<SearchUrlSyncService>,
};

// The bar depends on the port, not on any page's URL service, so stories must provide it explicitly.
const searchFilterStateStub = {
  provide: SearchFilterState,
  useValue: emptySearchState as unknown as SearchFilterState,
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
  ui: {
    common: {
      actions: {
        retry: 'Retry',
      },
    },
  },
  pages: {
    search: {
      searchFailed: {
        title: 'Search failed',
        message: 'Something went wrong and the search could not be completed. Please try again.',
      },
      termValidation: {
        tooShort: 'Enter at least 3 characters',
      },
      advancedSearch: {
        allResourceClasses: 'All resources',
        dataModel: 'Data model',
        orderBy: 'Sort by',
        property: 'Property',
        propertyOfClass: 'Property of {{class}}',
        resourceClass: 'Resource Class',
        fulltextSearch: 'Full-text search',
        fulltextSearchPlaceholder: 'Search…',
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
  searchFilterStateStub,
  searchFlowLoggerStub,
];

/** Use these AFTER provideAdvancedSearch() to override the real services with story-safe stubs. */
export const ADVANCED_SEARCH_SERVICE_STUBS = [searchUrlSyncServiceStub, searchFilterStateStub, searchFlowLoggerStub];

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

/**
 * Build a `ListNodeLabelResolver` stub whose `getLabels` returns the given static map. Stories that
 * exercise list-value chips (DEV-6857) can pass a pre-populated `nodeIri → labels[]` map so the pipe
 * resolves the multi-language labels synchronously, without needing a real list fetch.
 */
export const makeListNodeLabelResolverStub = (
  labelsByNodeIri: Record<string, StringLiteralV2[]> = {}
): Partial<ListNodeLabelResolver> => ({
  getLabels: (_rootIri: string, nodeIri: string) => labelsByNodeIri[nodeIri],
  changes$: of(undefined),
});

/**
 * Default chip-label story providers: the manager pair above plus an ontology stub and an empty list
 * resolver, so the DEV-6857-aware ChipLabelPipe can be constructed by any chip story out of the box.
 * Individual stories can override either service by placing a more specific provider *after* this
 * spread in their story's `applicationConfig`.
 */
export const CHIP_LABEL_STORY_PROVIDERS = [
  ...PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
  { provide: ListNodeLabelResolver, useValue: makeListNodeLabelResolverStub() },
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
