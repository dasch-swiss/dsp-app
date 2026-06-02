import { signal } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { UserService } from '@dasch-swiss/vre/core/session';
import { of } from 'rxjs';
import { IriLabelPair, OrderByItem, StatementElement } from './model';
import { OntologyDataService } from './service/ontology-data.service';
import { OrderByService } from './service/order-by.service';
import { QueryExecutionService } from './service/query-execution.service';
import { SearchStateService } from './service/search-state.service';

export const STORY_PROVIDERS = [
  provideAnimations(),
  provideRouter([{ path: '**', redirectTo: '' }]),
  { provide: UserService, useValue: { currentUser: null } as Partial<UserService> },
];

export const SAMPLE_ONTOLOGIES: IriLabelPair[] = [
  { iri: 'http://0.0.0.0:3333/ontology/0001/test/v2', label: 'Test Ontology' },
  { iri: 'http://0.0.0.0:3333/ontology/0001/images/v2', label: 'Images Ontology' },
];

export const SAMPLE_RESOURCE_CLASSES: IriLabelPair[] = [
  { iri: 'http://0.0.0.0:3333/ontology/0001/test/v2#Book', label: 'Book' },
  { iri: 'http://0.0.0.0:3333/ontology/0001/test/v2#Person', label: 'Person' },
];

export const makeOntologyDataServiceStub = (
  partial: Partial<OntologyDataService> = {}
): Partial<OntologyDataService> => ({
  ontologies$: of(SAMPLE_ONTOLOGIES),
  selectedOntology$: of({ id: SAMPLE_ONTOLOGIES[0].iri, label: SAMPLE_ONTOLOGIES[0].label } as any),
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

export const makeSearchStateServiceStub = (partial: Partial<SearchStateService> = {}): Partial<SearchStateService> => {
  const initialStatement = new StatementElement();
  return {
    selectedResourceClass$: of(null as unknown as IriLabelPair),
    isFormStateValidAndComplete$: of(true),
    completeStatements$: of([]),
    orderByItems$: of([]),
    currentState: {
      selectedResourceClass: SAMPLE_RESOURCE_CLASSES[0],
      statementElements: [initialStatement],
      orderBy: [],
    },
    validStatementElements: [],
    patchState: () => {},
    clearAllSelections: () => {},
    updateStatement: () => {},
    updateOrderBy: () => {},
    ...partial,
  };
};

export const makeQueryExecutionServiceStub = (
  partial: { queryIsExecuting?: boolean } = {}
): Partial<QueryExecutionService> => ({
  queryIsExecuting: signal(partial.queryIsExecuting ?? false),
});

export const makeOrderByServiceStub = (partial: Partial<OrderByService> = {}): Partial<OrderByService> => ({
  orderByItems$: of([] as OrderByItem[]),
  currentOrderBy: [],
  updateOrderBy: () => {},
  ...partial,
});

export const makeDspApiConnectionStub = (partial: Record<string, unknown> = {}) => ({
  v2: {
    onto: {
      getOntologiesByProjectIri: () => of({ ontologies: [] }),
      getOntology: () => of({ id: SAMPLE_ONTOLOGIES[0].iri, label: SAMPLE_ONTOLOGIES[0].label }),
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
