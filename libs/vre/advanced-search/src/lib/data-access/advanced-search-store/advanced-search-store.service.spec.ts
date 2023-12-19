import { Inject, Injectable, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Constants, KnoraApiConnection, ListNodeV2 } from '@dasch-swiss/dsp-js';
import { Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  AdvancedSearchService,
  ApiData,
  PropertyData,
} from '../advanced-search-service/advanced-search.service';
import { GravsearchService } from '../gravsearch-service/gravsearch.service';
import {
  AdvancedSearchStoreService,
  ParentChildPropertyPair,
  Operators,
  PropertyFormItem,
  PropertyFormListOperations,
} from './advanced-search-store.service';

export const DspApiConnectionToken = new InjectionToken<KnoraApiConnection>(
  'DspApiConnectionToken'
);

export class MockKnoraApiConnection {}

@Injectable()
export class MockAdvancedSearchService {
  constructor(
    @Inject(DspApiConnectionToken)
    private _knoraApiConnection: MockKnoraApiConnection
  ) {}

  /* eslint-disable @typescript-eslint/no-unused-vars */
  getList(listIri: string): Observable<ListNodeV2> {
    return of(new ListNodeV2());
  }

  resourceClassesList(
    ontologyIri: string,
    restrictToClass?: string
  ): Observable<ApiData[]> {
    return of([
      {
        iri: 'testIri',
        label: 'testLabel',
      },
    ]);
  }

  filteredPropertiesList(iri: string): Observable<PropertyData[]> {
    return of([
      {
        iri: 'filteredPropIri',
        label: 'test',
        objectType: '',
        isLinkedResourceProperty: false,
      },
    ]);
  }

  getResourcesListCount(
    searchTerm: string,
    objectType: string
  ): Observable<number> {
    return of(1);
  }

  getResourcesList(
    searchTerm: string,
    objectType: string,
    offset?: number
  ): Observable<ApiData[]> {
    return of([
      {
        iri: 'testIri',
        label: 'testLabel',
      },
    ]);
  }

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export class MockGravsearchService {}

describe('AdvancedSearchStoreService', () => {
  let service: AdvancedSearchStoreService;
  let advancedSearchService: AdvancedSearchService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        MockKnoraApiConnection,
        {
          provide: DspApiConnectionToken,
          useValue: new MockKnoraApiConnection(),
        },
        {
          provide: AdvancedSearchService,
          useClass: MockAdvancedSearchService,
        },
        {
          provide: GravsearchService,
          useClass: MockGravsearchService,
        },
        AdvancedSearchStoreService,
      ],
    });
    service = TestBed.inject(AdvancedSearchStoreService);
    advancedSearchService = TestBed.inject(AdvancedSearchService);

    expect(service).toBeTruthy();
    service.setState({
      ontologies: [],
      ontologiesLoading: false,
      resourceClasses: [],
      resourceClassesLoading: false,
      selectedProject: undefined,
      selectedOntology: undefined,
      selectedResourceClass: undefined,
      propertyFormList: [],
      properties: [],
      propertiesLoading: false,
      propertiesOrderByList: [],
      filteredProperties: [],
      matchResourceClassesLoading: false,
      resourcesSearchResultsLoading: false,
      resourcesSearchResultsCount: 0,
      resourcesSearchNoResults: false,
      resourcesSearchResultsPageNumber: 0,
      resourcesSearchResults: [],
    });
  });

  describe('isPropertyFormItemListInvalid', () => {
    it('should return true if selectedProperty is undefined', () => {
      const propertyFormItem = {
        id: '1',
        selectedProperty: undefined,
        selectedOperator: Operators.Equals,
        searchValue: 'test',
        operators: [],
        list: undefined,
      };

      expect(
        service.isPropertyFormItemListInvalid(propertyFormItem)
      ).toBeTruthy();
    });

    it('should return false if selectedOperator is exists or not exists', () => {
      const propertyFormItem = {
        id: '1',
        selectedProperty: {
          iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#int',
          label: 'int',
          objectType: Constants.IntValue,
          isLinkedResourceProperty: false,
        },
        selectedOperator: Operators.Exists,
        searchValue: undefined,
        operators: [],
        list: undefined,
      };

      expect(
        service.isPropertyFormItemListInvalid(propertyFormItem)
      ).toBeFalsy();

      propertyFormItem.selectedOperator = Operators.NotExists;

      expect(
        service.isPropertyFormItemListInvalid(propertyFormItem)
      ).toBeFalsy();
    });

    it('should return true if the value is an empty array', () => {
      const propertyFormItem = {
        id: '1',
        selectedProperty: {
          iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#linkToTest',
          label: 'Link to Test',
          objectType:
            'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#test',
          isLinkedResourceProperty: true,
        },
        selectedOperator: Operators.Equals,
        searchValue: [],
        operators: [],
        list: undefined,
      };

      expect(
        service.isPropertyFormItemListInvalid(propertyFormItem)
      ).toBeTruthy();
    });

    it('should return true if the value is an array that contains an invalid item', () => {
      const propertyFormItem = {
        id: '1',
        selectedProperty: {
          iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#linkToTest',
          label: 'Link to Test',
          objectType:
            'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#test',
          isLinkedResourceProperty: true,
        },
        selectedOperator: Operators.Equals,
        searchValue: [
          {
            id: '2',
            selectedProperty: {
              iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#hasFirstName',
              label: 'hasFirstName',
              objectType:
                'http://api.knora.org/ontology/knora-api/v2#TextValue',
              isLinkedResourceProperty: false,
            },
            selectedOperator: Operators.Equals,
            searchValue: undefined, // this is invalid as it should be a string
            operators: [],
            list: undefined,
          },
        ],
        operators: [],
        list: undefined,
      };

      expect(
        service.isPropertyFormItemListInvalid(propertyFormItem)
      ).toBeTruthy();
    });

    it('should return false if the value is an array that contains all valid items', () => {
      const propertyFormItem = {
        id: '1',
        selectedProperty: {
          iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#linkToTest',
          label: 'Link to Test',
          objectType:
            'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#test',
          isLinkedResourceProperty: true,
        },
        selectedOperator: Operators.Equals,
        searchValue: [
          {
            id: '2',
            selectedProperty: {
              iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#hasFirstName',
              label: 'hasFirstName',
              objectType:
                'http://api.knora.org/ontology/knora-api/v2#TextValue',
              isLinkedResourceProperty: false,
            },
            selectedOperator: Operators.Equals,
            searchValue: 'eric',
            operators: [],
            list: undefined,
          },
        ],
        operators: [],
        list: undefined,
      };

      expect(
        service.isPropertyFormItemListInvalid(propertyFormItem)
      ).toBeFalsy();
    });

    it('should return true if the value is undefined or an empty string', () => {
      const propertyFormItem = {
        id: '1',
        selectedProperty: {
          iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#hasFirstName',
          label: 'hasFirstName',
          objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
          isLinkedResourceProperty: false,
        },
        selectedOperator: Operators.Equals,
        searchValue: undefined as string | undefined,
        operators: [],
        list: undefined,
      };

      expect(
        service.isPropertyFormItemListInvalid(propertyFormItem)
      ).toBeTruthy();

      propertyFormItem.searchValue = '';

      expect(
        service.isPropertyFormItemListInvalid(propertyFormItem)
      ).toBeTruthy();
    });

    it('should return false if the value is a string', () => {
      const propertyFormItem = {
        id: '1',
        selectedProperty: {
          iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#hasFirstName',
          label: 'hasFirstName',
          objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
          isLinkedResourceProperty: false,
        },
        selectedOperator: Operators.Equals,
        searchValue: 'eric',
        operators: [],
        list: undefined,
      };

      expect(
        service.isPropertyFormItemListInvalid(propertyFormItem)
      ).toBeFalsy();
    });
  });

  describe('updateSelectedOntology', () => {
    it('should update the selected ontology', () => {
      const ontology = {
        iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2',
        label: "Eric's Test Project",
      };

      service.updateSelectedOntology(ontology);

      service.selectedOntology$.pipe(take(1)).subscribe(onto => {
        expect(onto).not.toBeUndefined();
        if (onto) {
          expect(onto.iri).toEqual(
            'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2'
          );
          expect(onto.label).toEqual("Eric's Test Project");
        }
      });
    });
  });

  describe('updateSelectedResourceClass', () => {
    it('should update the selected resource class', () => {
      const testPropertyData = {
        iri: '',
        label: '',
        objectType: '',
        isLinkedResourceProperty: false,
      };

      const testOrderByItem = {
        id: '',
        label: '',
        orderBy: false,
      };

      const testProperties = [testPropertyData];
      const testOrderByList = [testOrderByItem];

      service.patchState({ filteredProperties: testProperties });
      service.patchState({ propertiesOrderByList: testOrderByList });

      service.filteredProperties$.pipe(take(1)).subscribe(fp => {
        expect(fp).not.toBeUndefined();
        if (fp) {
          expect(fp.length).toEqual(1);
        }
      });

      service.propertiesOrderByList$.pipe(take(1)).subscribe(pol => {
        expect(pol).not.toBeUndefined();
        if (pol) {
          expect(pol.length).toEqual(1);
        }
      });

      const resourceClass = {
        iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#Person',
        label: 'Person',
      };

      service.updateSelectedResourceClass(resourceClass);

      service.selectedResourceClass$.pipe(take(1)).subscribe(rc => {
        expect(rc).not.toBeUndefined();
        if (rc) {
          expect(rc.iri).toEqual(
            'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#Person'
          );
          expect(rc.label).toEqual('Person');
        }
      });

      service.filteredProperties$.pipe(take(1)).subscribe(fp => {
        expect(fp).not.toBeUndefined();
        if (fp) {
          expect(fp.length).toEqual(0);
        }
      });

      service.propertiesOrderByList$.pipe(take(1)).subscribe(pol => {
        expect(pol).not.toBeUndefined();
        if (pol) {
          expect(pol.length).toEqual(0);
        }
      });
    });

    it('should update the selected resource class to undefined', () => {
      const testPropertyData = {
        iri: '',
        label: '',
        objectType: '',
        isLinkedResourceProperty: false,
      };

      const testFilteredProperties = [testPropertyData];

      service.patchState({ filteredProperties: testFilteredProperties });

      service.filteredProperties$.pipe(take(1)).subscribe(fp => {
        expect(fp).not.toBeUndefined();
        if (fp) {
          expect(fp.length).toEqual(1);
        }
      });

      const resourceClass = undefined;

      service.updateSelectedResourceClass(resourceClass);

      service.selectedResourceClass$.pipe(take(1)).subscribe(rc => {
        expect(rc).toBeUndefined();
      });

      service.filteredProperties$.pipe(take(1)).subscribe(fp => {
        expect(fp).not.toBeUndefined();
        if (fp) {
          expect(fp.length).toEqual(0);
        }
      });
    });
  });

  describe('updatePropertyFormList', () => {
    it('should add a property form item to the list', () => {
      const propertyFormItem = {
        id: '1',
        selectedProperty: undefined,
        selectedOperator: undefined,
        searchValue: undefined,
        operators: [],
        list: undefined,
      };

      service.updatePropertyFormList(
        PropertyFormListOperations.Add,
        propertyFormItem
      );

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        if (pfl) {
          expect(pfl.length).toEqual(1);
        }
      });
    });

    it('should delete a property form item from the list', () => {
      const propertyFormItem = {
        id: '1',
        selectedProperty: undefined,
        selectedOperator: undefined,
        searchValue: undefined,
        operators: [],
        list: undefined,
      };

      service.updatePropertyFormList(
        PropertyFormListOperations.Add,
        propertyFormItem
      );

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        if (pfl) {
          expect(pfl.length).toEqual(1);
        }
      });

      const orderByItem = {
        id: '1',
        label: 'test',
        orderBy: false,
      };

      service.patchState({ propertiesOrderByList: [orderByItem] });

      service.propertiesOrderByList$.pipe(take(1)).subscribe(pol => {
        expect(pol).not.toBeUndefined();
        if (pol) {
          expect(pol.length).toEqual(1);
        }
      });

      service.updatePropertyFormList(
        PropertyFormListOperations.Delete,
        propertyFormItem
      );

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        if (pfl) {
          expect(pfl.length).toEqual(0);
        }
      });

      service.propertiesOrderByList$.pipe(take(1)).subscribe(pol => {
        expect(pol).not.toBeUndefined();
        if (pol) {
          expect(pol.length).toEqual(0);
        }
      });
    });
  });

  describe('addChildPropertyFormList', () => {
    it('should add a child property form item to the list', () => {
      const propertyFormItem = {
        id: '1',
        selectedProperty: undefined,
        selectedOperator: undefined,
        searchValue: [],
        operators: [],
        list: undefined,
      };

      service.updatePropertyFormList(
        PropertyFormListOperations.Add,
        propertyFormItem
      );

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        if (pfl) {
          expect(pfl.length).toEqual(1);
        }
      });

      service.addChildPropertyFormList(propertyFormItem);

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        if (pfl) {
          // searchValue should be an array with one item
          expect(pfl[0].searchValue?.length).toEqual(1);
        }
      });
    });
  });

  describe('deleteChildPropertyFormList', () => {
    it('should delete a child property form item from the list', () => {
      // parent property form item
      const propertyFormItem = {
        id: '1',
        selectedProperty: undefined,
        selectedOperator: undefined,
        searchValue: [],
        operators: [],
        list: undefined,
      };

      service.updatePropertyFormList(
        PropertyFormListOperations.Add,
        propertyFormItem
      );

      service.addChildPropertyFormList(propertyFormItem);

      let childProp: PropertyFormItem | undefined;

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        if (pfl && Array.isArray(pfl[0].searchValue)) {
          childProp = pfl[0].searchValue[0];
        }
      });

      let parentChildPair: ParentChildPropertyPair | undefined;

      expect(childProp).not.toBeUndefined();

      if (childProp) {
        parentChildPair = {
          parentProperty: propertyFormItem,
          childProperty: childProp,
        };

        service.deleteChildPropertyFormList(parentChildPair);

        service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
          expect(pfl).not.toBeUndefined();
          if (pfl) {
            // searchValue should be an array with no items
            expect(pfl[0].searchValue?.length).toEqual(0);
          }
        });
      }
    });
  });

  describe('updateSelectedProperty', () => {
    it('should update the selected property', () => {
      const propFormItem = {
        id: '1',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined,
        searchValue: undefined,
        operators: [],
        list: undefined,
      };

      service.patchState({ propertyFormList: [propFormItem] });

      const orderByItem = {
        id: '1',
        label: 'test',
        orderBy: false,
      };

      service.patchState({ propertiesOrderByList: [orderByItem] });

      const newSelectedProp = {
        iri: 'testIri',
        label: 'test label',
        objectType: Constants.TextValue,
        isLinkedResourceProperty: false,
      };

      propFormItem.selectedProperty = newSelectedProp;

      service.updateSelectedProperty(propFormItem);

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        if (pfl) {
          expect(pfl[0].selectedProperty).toEqual(newSelectedProp);
        }
      });
    });

    it('should update the list of a selected property', () => {
      const propFormItem = {
        id: '1',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined,
        searchValue: undefined,
        operators: [],
        list: undefined,
      };

      service.patchState({ propertyFormList: [propFormItem] });

      const orderByItem = {
        id: '1',
        label: 'test',
        orderBy: false,
      };

      service.patchState({ propertiesOrderByList: [orderByItem] });

      const newSelectedProp = {
        iri: 'testIri',
        label: 'test label',
        objectType: Constants.TextValue,
        isLinkedResourceProperty: false,
        listIri: 'testListIri',
      };

      propFormItem.selectedProperty = newSelectedProp;

      // spy on the getList method
      const getList = jest.spyOn(advancedSearchService, 'getList');

      service.updateSelectedProperty(propFormItem);

      expect(getList).toHaveBeenCalledWith(newSelectedProp.listIri);

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        if (pfl) {
          expect(pfl[0].list).not.toBeUndefined();
        }
      });
    });
  });

  describe('updateChildSelectedProperty', () => {
    it('should update the selected property of a child property form item', () => {
      // child
      const childPropFormItem = {
        id: '2',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined,
        searchValue: undefined,
        operators: [],
        list: undefined,
      };

      // parent
      const propFormItem = {
        id: '1',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined,
        searchValue: [childPropFormItem],
        operators: [],
        list: undefined,
      };

      service.patchState({ propertyFormList: [propFormItem] });

      const updatedSelectedProp = {
        iri: 'testIri',
        label: 'test label',
        objectType: Constants.TextValue,
        isLinkedResourceProperty: false,
      };

      childPropFormItem.selectedProperty = updatedSelectedProp;

      const parentChildPair: ParentChildPropertyPair = {
        parentProperty: propFormItem,
        childProperty: childPropFormItem,
      };

      service.updateChildSelectedProperty(parentChildPair);

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        expect(Array.isArray(pfl[0].searchValue)).toBeTruthy();
        if (pfl && Array.isArray(pfl[0].searchValue)) {
          expect(pfl[0].searchValue[0].selectedProperty).toEqual(
            updatedSelectedProp
          );
        }
      });
    });
    it('should update the list of the selected property of a child property form item', () => {
      // child
      const childPropFormItem = {
        id: '2',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined,
        searchValue: undefined,
        operators: [],
        list: undefined,
      };

      // parent
      const propFormItem = {
        id: '1',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined,
        searchValue: [childPropFormItem],
        operators: [],
        list: undefined,
      };

      service.patchState({ propertyFormList: [propFormItem] });

      childPropFormItem.selectedProperty = {
        iri: 'testIri',
        label: 'test label',
        objectType: Constants.TextValue,
        isLinkedResourceProperty: false,
        listIri: 'testListIri',
      };

      const parentChildPair: ParentChildPropertyPair = {
        parentProperty: propFormItem,
        childProperty: childPropFormItem,
      };

      // spy on the getList method
      const getList = jest.spyOn(advancedSearchService, 'getList');

      service.updateChildSelectedProperty(parentChildPair);

      expect(getList).toHaveBeenCalledWith(
        childPropFormItem.selectedProperty.listIri
      );

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        expect(Array.isArray(pfl[0].searchValue)).toBeTruthy();
        if (pfl && Array.isArray(pfl[0].searchValue)) {
          expect(pfl[0].searchValue[0].list).not.toBeUndefined();
        }
      });
    });
  });

  describe('updateSelectedOperator', () => {
    it('should update the selected operator', () => {
      const propFormItem = {
        id: '1',
        selectedProperty: undefined,
        selectedOperator: undefined as Operators | undefined,
        searchValue: undefined,
        operators: [],
        list: undefined,
      };

      service.patchState({ propertyFormList: [propFormItem] });

      propFormItem.selectedOperator = Operators.Equals;

      service.updateSelectedOperator(propFormItem);

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        expect(pfl[0].selectedOperator).toEqual(Operators.Equals);
      });
    });

    it('should update the selected operator to exists', () => {
      const propFormItem = {
        id: '1',
        selectedProperty: undefined,
        selectedOperator: undefined as Operators | undefined,
        searchValue: 'test',
        operators: [],
        list: undefined,
      };

      service.patchState({ propertyFormList: [propFormItem] });

      propFormItem.selectedOperator = Operators.Exists;

      service.updateSelectedOperator(propFormItem);

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        expect(pfl[0].selectedOperator).toEqual(Operators.Exists);
        expect(pfl[0].searchValue).toBeUndefined();
      });
    });

    it('should update the selected operator to matches', () => {
      const propFormItem = {
        id: '1',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined as Operators | undefined,
        searchValue: undefined,
        operators: [],
        list: undefined,
      };

      propFormItem.selectedProperty = {
        iri: 'testIri',
        label: 'test label',
        objectType: Constants.TextValue,
        isLinkedResourceProperty: false,
      };

      // spy on the filteredPropertiesList method
      const filteredPropertiesList = jest.spyOn(
        advancedSearchService,
        'filteredPropertiesList'
      );

      service.patchState({ propertyFormList: [propFormItem] });

      expect(filteredPropertiesList).not.toHaveBeenCalled();

      propFormItem.selectedOperator = Operators.Matches;

      service.updateSelectedOperator(propFormItem);

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        expect(pfl[0].selectedOperator).toEqual(Operators.Exists);
        expect(pfl[0].searchValue).toBeUndefined();
      });
    });

    it('should update the selected operator to matches for a linked resource property', () => {
      const propFormItem = {
        id: '1',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined as Operators | undefined,
        searchValue: undefined,
        operators: [],
        list: undefined,
      };

      propFormItem.selectedProperty = {
        iri: 'testIri',
        label: 'test label',
        objectType: 'linkedResourceIri',
        isLinkedResourceProperty: true,
      };

      service.patchState({ propertyFormList: [propFormItem] });
      service.patchState({
        selectedOntology: { iri: 'ontoIri', label: 'ontoLabel' },
      });

      propFormItem.selectedOperator = Operators.Matches;

      // spy on the resourceClassesList method
      const resourceClassesList = jest.spyOn(
        advancedSearchService,
        'resourceClassesList'
      );

      service.updateSelectedOperator(propFormItem);

      expect(resourceClassesList).toHaveBeenCalledWith(
        'ontoIri',
        'linkedResourceIri'
      );

      // fix this
      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        expect(pfl[0].selectedOperator).toEqual(Operators.Exists);
        expect(pfl[0].searchValue).toHaveLength(0);
        expect(pfl[0].childPropertiesList).toHaveLength(1);
      });
    });
  });

  describe('updateSelectedMatchPropertyResourceClass', () => {
    it('should update the selected resource class', () => {
      const propFormItem = {
        id: '1',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined as Operators | undefined,
        searchValue: undefined,
        operators: [],
        list: undefined,
        selectedMatchPropertyResourceClass: undefined as ApiData | undefined,
      };

      propFormItem.selectedProperty = {
        iri: 'testIri',
        label: 'test label',
        objectType: 'linkedResourceIri',
        isLinkedResourceProperty: true,
      };

      propFormItem.selectedOperator = Operators.Matches;

      service.patchState({ propertyFormList: [propFormItem] });

      propFormItem.selectedMatchPropertyResourceClass = {
        iri: 'matchPropResClassIri',
        label: 'test label',
      };

      // spy on the filteredPropertiesList method
      const filteredPropertiesList = jest.spyOn(
        advancedSearchService,
        'filteredPropertiesList'
      );

      service.updateSelectedMatchPropertyResourceClass(propFormItem);

      expect(filteredPropertiesList).toHaveBeenCalledWith(
        'matchPropResClassIri'
      );
    });
  });

  describe('updateChildSelectedOperator', () => {
    it('should update the selected operator of a child property form item', () => {
      // child
      const childPropFormItem = {
        id: '2',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined as Operators | undefined,
        searchValue: undefined,
        operators: [],
        list: undefined,
      };

      // parent
      const propFormItem = {
        id: '1',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined,
        searchValue: [childPropFormItem],
        operators: [],
        list: undefined,
      };

      service.patchState({ propertyFormList: [propFormItem] });

      childPropFormItem.selectedOperator = Operators.Equals;

      const parentChildPair: ParentChildPropertyPair = {
        parentProperty: propFormItem,
        childProperty: childPropFormItem,
      };

      service.updateChildSelectedProperty(parentChildPair);

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        expect(Array.isArray(pfl[0].searchValue)).toBeTruthy();
        if (pfl && Array.isArray(pfl[0].searchValue)) {
          expect(pfl[0].searchValue[0].selectedOperator).toEqual(
            Operators.Equals
          );
        }
      });
    });

    it('should update the selected operator of a child property form item and set the search value to undefined', () => {
      // child
      const childPropFormItem = {
        id: '2',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined as Operators | undefined,
        searchValue: 'test',
        operators: [],
        list: undefined,
      };

      // parent
      const propFormItem = {
        id: '1',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined,
        searchValue: [childPropFormItem],
        operators: [],
        list: undefined,
      };

      service.patchState({ propertyFormList: [propFormItem] });

      childPropFormItem.selectedOperator = Operators.Exists;

      const parentChildPair: ParentChildPropertyPair = {
        parentProperty: propFormItem,
        childProperty: childPropFormItem,
      };

      service.updateChildSelectedProperty(parentChildPair);

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        expect(Array.isArray(pfl[0].searchValue)).toBeTruthy();
        if (pfl && Array.isArray(pfl[0].searchValue)) {
          expect(pfl[0].searchValue[0].searchValue).toBeUndefined();
        }
      });
    });
  });

  describe('updateSearchValue', () => {
    it('should update the search value', () => {
      const propFormItem = {
        id: '1',
        selectedProperty: undefined,
        selectedOperator: undefined,
        searchValue: undefined as string | undefined,
        operators: [],
        list: undefined,
      };

      service.patchState({ propertyFormList: [propFormItem] });

      propFormItem.searchValue = 'test';

      service.updateSearchValue(propFormItem);

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        expect(pfl[0].searchValue).toEqual('test');
      });
    });
  });

  describe('updateChildSearchValue', () => {
    it('should update the search value of a child property form item', () => {
      // child
      const childPropFormItem = {
        id: '2',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined,
        searchValue: undefined as string | undefined,
        operators: [],
        list: undefined,
      };

      // parent
      const propFormItem = {
        id: '1',
        selectedProperty: undefined as PropertyData | undefined,
        selectedOperator: undefined,
        searchValue: [childPropFormItem],
        operators: [],
        list: undefined,
      };

      service.patchState({ propertyFormList: [propFormItem] });

      childPropFormItem.searchValue = 'test';

      const parentChildPair: ParentChildPropertyPair = {
        parentProperty: propFormItem,
        childProperty: childPropFormItem,
      };

      service.updateChildSearchValue(parentChildPair);

      service.propertyFormList$.pipe(take(1)).subscribe(pfl => {
        expect(pfl).not.toBeUndefined();
        expect(Array.isArray(pfl[0].searchValue)).toBeTruthy();
        if (pfl && Array.isArray(pfl[0].searchValue)) {
          expect(pfl[0].searchValue[0].searchValue).toEqual('test');
        }
      });
    });
  });

  describe('updateResourcesSearchResults', () => {
    it('should update the resources search results', () => {
      const searchItem = {
        value: 'test',
        objectType: Constants.TextValue,
      };

      // spy on the getResourcesList method
      const getResourcesListCountSpy = jest.spyOn(
        advancedSearchService,
        'getResourcesListCount'
      );

      // spy on the getResourcesList method
      const getResourcesListSpy = jest.spyOn(
        advancedSearchService,
        'getResourcesList'
      );

      service.updateResourcesSearchResults(searchItem);

      expect(getResourcesListCountSpy).toBeCalledWith(
        searchItem.value,
        searchItem.objectType
      );

      expect(getResourcesListSpy).toBeCalledWith(
        searchItem.value,
        searchItem.objectType
      );

      service.resourcesSearchResultsCount$.pipe(take(1)).subscribe(rsrc => {
        expect(rsrc).not.toBeUndefined();
        if (rsrc) {
          expect(rsrc).toEqual(1);
        }
      });

      service.resourcesSearchResults$.pipe(take(1)).subscribe(rsr => {
        expect(rsr).not.toBeUndefined();
        if (rsr) {
          expect(rsr.length).toEqual(1);
        }
      });
    });
  });

  describe('loadMoreResourcesSearchResults', () => {
    it('should load more resources search results', () => {
      service.patchState({ resourcesSearchResultsCount: 2 });
      service.patchState({ resourcesSearchResultsPageNumber: 0 });

      service.patchState({
        resourcesSearchResults: [
          {
            iri: 'testIri',
            label: 'testLabel',
          },
        ],
      });

      const searchItem = {
        value: 'test',
        objectType: Constants.TextValue,
      };

      // spy on the getResourcesList method
      const getResourcesListSpy = jest.spyOn(
        advancedSearchService,
        'getResourcesList'
      );

      service.loadMoreResourcesSearchResults(searchItem);

      expect(getResourcesListSpy).toBeCalledWith(
        searchItem.value,
        searchItem.objectType,
        1
      );

      service.resourcesSearchResults$.pipe(take(1)).subscribe(rsr => {
        expect(rsr).not.toBeUndefined();
        if (rsr) {
          expect(rsr.length).toEqual(2);
        }
      });
    });
  });
});
