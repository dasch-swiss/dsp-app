import { TestBed } from '@angular/core/testing';

import { AdvancedSearchService } from './advanced-search.service';
import {
    Constants,
    KnoraApiConfig,
    KnoraApiConnection,
    ReadOntology,
    ReadResource,
    ResourceClassAndPropertyDefinitions,
    ResourceClassDefinition,
    ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import {
    DspApiConfigToken,
    DspApiConnectionToken,
} from '@dasch-swiss/vre/shared/app-config';
import { of } from 'rxjs';

describe('AdvancedSearchService', () => {
    let service: AdvancedSearchService;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: DspApiConfigToken,
                    useValue: new KnoraApiConfig('http', '0.0.0.0', 3333),
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(
                        new KnoraApiConfig('http', '0.0.0.0', 3333)
                    ),
                },
            ],
        });
        service = TestBed.inject(AdvancedSearchService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('ontologies', () => {
        it('should return a list of all ontologies', (done) => {
            const mockOntologiesResponse = {
                ontologies: [
                    {
                        id: 'ontology1',
                        label: 'Ontology 1',
                        attachedToProject: 'project1',
                    },
                    {
                        id: 'ontology2',
                        label: 'Ontology 2',
                        attachedToProject: 'project2',
                    },
                ],
            };

            // Mock the API call using a mock value
            const mockDspApiConnection = {
                v2: {
                    onto: {
                        getOntologiesMetadata: jest
                            .fn()
                            .mockReturnValue(of(mockOntologiesResponse)),
                    },
                },
            };

            // Use type assertion to bypass type checking for the mock connection
            service['_dspApiConnection'] =
                mockDspApiConnection as unknown as KnoraApiConnection;

            service.allOntologiesList().subscribe((ontologies) => {
                expect(ontologies).toEqual([
                    { iri: 'ontology1', label: 'Ontology 1' },
                    { iri: 'ontology2', label: 'Ontology 2' },
                ]);
                done();
            });
        });

        it('should return a list of ontologies limited to a project', (done) => {
            const mockOntologiesResponse = {
                ontologies: [
                    {
                        id: 'ontology1',
                        label: 'Ontology 1',
                        attachedToProject: 'project1',
                    },
                    {
                        id: 'ontology2',
                        label: 'Ontology 2',
                        attachedToProject: 'project1',
                    },
                ],
            };

            // Mock the API call using a mock value
            const mockDspApiConnection = {
                v2: {
                    onto: {
                        getOntologiesByProjectIri: jest
                            .fn()
                            .mockReturnValue(of(mockOntologiesResponse)),
                    },
                },
            };

            const projectIri = 'project1';

            // Use type assertion to bypass type checking for the mock connection
            service['_dspApiConnection'] =
                mockDspApiConnection as unknown as KnoraApiConnection;

            service
                .ontologiesInProjectList(projectIri)
                .subscribe((ontologies) => {
                    expect(ontologies).toEqual([
                        { iri: 'ontology1', label: 'Ontology 1' },
                        { iri: 'ontology2', label: 'Ontology 2' },
                    ]);
                    done();
                });
        });
    });

    describe('resource classes', () => {
        it('should return a list of all resource classes', (done) => {
            const ontologyIri = 'ontology1'; // Replace with the desired ontology IRI

            const resourceClass1 = new ResourceClassDefinition();
            resourceClass1.id = 'class1';
            resourceClass1.label = 'Class 1';

            const resourceClass2 = new ResourceClassDefinition();
            resourceClass2.id = 'class2';
            resourceClass2.label = 'Class 2';

            const resourceClass3 = new ResourceClassDefinition();
            resourceClass3.id = 'class3';
            resourceClass3.label = 'Class 3';

            const ontology = new ReadOntology();

            // add in opposite order to test sorting
            ontology.classes = {
                class3: resourceClass3,
                class2: resourceClass2,
                class1: resourceClass1,
            };

            // Mock the API call using a mock value
            const mockDspApiConnection = {
                v2: {
                    onto: {
                        getOntology: jest.fn().mockReturnValue(of(ontology)),
                    },
                },
            };

            // Use type assertion to bypass type checking for the mock connection
            service['_dspApiConnection'] =
                mockDspApiConnection as unknown as KnoraApiConnection;

            service
                .resourceClassesList(ontologyIri)
                .subscribe((resourceClasses) => {
                    expect(resourceClasses).toEqual([
                        { iri: 'class1', label: 'Class 1' },
                        { iri: 'class2', label: 'Class 2' },
                        { iri: 'class3', label: 'Class 3' },
                    ]);
                    done();
                });
        });
    });

    describe('properties', () => {
        it('should return a list of all properties', (done) => {
            // normal property
            const propDef1 = new ResourcePropertyDefinition();
            propDef1.id = 'prop1';
            propDef1.label = 'Property 1';
            propDef1.objectType = Constants.IntValue;
            propDef1.isEditable = true;
            propDef1.isLinkValueProperty = false;

            // linked resource property
            const propDef2 = new ResourcePropertyDefinition();
            propDef2.id = 'prop2';
            propDef2.label = 'Property 2';
            propDef2.objectType =
                'http://0.0.0.0:3333/ontology/0801/newton/v2#letter';
            propDef2.isEditable = true;
            propDef2.isLinkValueProperty = false;

            // list property
            const propDef3 = new ResourcePropertyDefinition();
            propDef3.id = 'prop3';
            propDef3.label = 'Property 3';
            propDef3.objectType = Constants.ListValue;
            propDef3.isEditable = true;
            propDef3.isLinkValueProperty = false;
            propDef3.guiAttributes = [
                'hlist=<http://rdfh.ch/lists/0420/6-Vp0F_1TfSS-DS_9q-Ucw>',
            ];

            // should be filtered out
            const propDef4 = new ResourcePropertyDefinition();
            propDef4.id = 'prop4';
            propDef4.label = 'Property 4';
            propDef4.objectType = Constants.DecimalValue;
            propDef4.isEditable = true;
            propDef4.isLinkValueProperty = true;

            // should be filtered out
            const propDef5 = new ResourcePropertyDefinition();
            propDef5.id = 'prop5';
            propDef5.label = 'Property 5';
            propDef5.objectType = Constants.DateValue;
            propDef5.isEditable = false;
            propDef5.isLinkValueProperty = false;

            // should be filtered out
            const propDef6 = new ResourcePropertyDefinition();
            propDef6.id = 'prop6';
            propDef6.label = 'Property 6';
            propDef6.objectType = Constants.BooleanValue;
            propDef6.isEditable = true;
            propDef6.isLinkValueProperty = true;

            const ontology = new ReadOntology();

            ontology.properties = {
                prop1: propDef1,
                prop2: propDef2,
                prop3: propDef3,
                prop4: propDef4,
                prop5: propDef5,
            };

            const ontologyIri = 'ontology1';

            // Mock the API call using a mock value
            const mockOntologyCache = {
                getOntology: jest
                    .fn()
                    .mockReturnValue(of(new Map([[ontologyIri, ontology]]))),
            };

            // Set the mock ontology cache in the service
            service['_dspApiConnection'] = {
                v2: { ontologyCache: mockOntologyCache },
            } as unknown as KnoraApiConnection;

            service.propertiesList(ontologyIri).subscribe((properties) => {
                expect(properties).toEqual([
                    {
                        iri: 'prop1',
                        label: 'Property 1',
                        objectType: Constants.IntValue,
                        isLinkedResourceProperty: false,
                    },
                    {
                        iri: 'prop2',
                        label: 'Property 2',
                        objectType:
                            'http://0.0.0.0:3333/ontology/0801/newton/v2#letter',
                        isLinkedResourceProperty: true,
                    },
                    {
                        iri: 'prop3',
                        label: 'Property 3',
                        objectType: Constants.ListValue,
                        isLinkedResourceProperty: false,
                        listIri:
                            'http://rdfh.ch/lists/0420/6-Vp0F_1TfSS-DS_9q-Ucw',
                    },
                ]);
                done();
            });
        });

        it('should return a list of properties filtered by resource class', (done) => {
            // normal property
            const propDef1 = new ResourcePropertyDefinition();
            propDef1.id = 'prop1';
            propDef1.label = 'Property 1';
            propDef1.objectType = Constants.IntValue;
            propDef1.isEditable = true;
            propDef1.isLinkValueProperty = false;

            // linked resource property
            const propDef2 = new ResourcePropertyDefinition();
            propDef2.id = 'prop2';
            propDef2.label = 'Property 2';
            propDef2.objectType =
                'http://0.0.0.0:3333/ontology/0801/newton/v2#letter';
            propDef2.isEditable = true;
            propDef2.isLinkValueProperty = false;

            // list property
            const propDef3 = new ResourcePropertyDefinition();
            propDef3.id = 'prop3';
            propDef3.label = 'Property 3';
            propDef3.objectType = Constants.ListValue;
            propDef3.isEditable = true;
            propDef3.isLinkValueProperty = false;
            propDef3.guiAttributes = [
                'hlist=<http://rdfh.ch/lists/0420/6-Vp0F_1TfSS-DS_9q-Ucw>',
            ];

            // should be filtered out
            const propDef4 = new ResourcePropertyDefinition();
            propDef4.id = 'prop4';
            propDef4.label = 'Property 4';
            propDef4.objectType = Constants.DecimalValue;
            propDef4.isEditable = true;
            propDef4.isLinkValueProperty = true;

            // should be filtered out
            const propDef5 = new ResourcePropertyDefinition();
            propDef5.id = 'prop5';
            propDef5.label = 'Property 5';
            propDef5.objectType = Constants.DateValue;
            propDef5.isEditable = false;
            propDef5.isLinkValueProperty = false;

            // should be filtered out
            const propDef6 = new ResourcePropertyDefinition();
            propDef6.id = 'prop6';
            propDef6.label = 'Property 6';
            propDef6.objectType = Constants.BooleanValue;
            propDef6.isEditable = true;
            propDef6.isLinkValueProperty = true;

            const ontology = new ResourceClassAndPropertyDefinitions(
                {},
                {
                    resourceProp1: propDef1,
                    resourceProp2: propDef2,
                    resourceProp3: propDef3,
                    resourceProp4: propDef4,
                    resourceProp5: propDef5,
                    resourceProp6: propDef6,
                }
            );

            // Mock the API call using a mock value
            const mockOntologyCache = {
                getResourceClassDefinition: jest
                    .fn()
                    .mockReturnValue(of(ontology)),
            };

            const resourceClassIri = 'resourceClassIri';

            // Set the mock ontology cache in the service
            service['_dspApiConnection'] = {
                v2: { ontologyCache: mockOntologyCache },
            } as unknown as KnoraApiConnection;

            service
                .filteredPropertiesList(resourceClassIri)
                .subscribe((properties) => {
                    expect(properties).toEqual([
                        {
                            iri: 'prop1',
                            label: 'Property 1',
                            objectType: Constants.IntValue,
                            isLinkedResourceProperty: false,
                        },
                        {
                            iri: 'prop2',
                            label: 'Property 2',
                            objectType:
                                'http://0.0.0.0:3333/ontology/0801/newton/v2#letter',
                            isLinkedResourceProperty: true,
                        },
                        {
                            iri: 'prop3',
                            label: 'Property 3',
                            objectType: Constants.ListValue,
                            isLinkedResourceProperty: false,
                            listIri:
                                'http://rdfh.ch/lists/0420/6-Vp0F_1TfSS-DS_9q-Ucw',
                        },
                    ]);
                    done();
                });
        });
    });

    describe('resource search', () => {
        it('should return count of the resources', (done) => {
            const searchValue = 'searchQuery';
            const resourceClassIri =
                'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#test';

            const mockCountQueryResponse = {
                numberOfResults: 123,
            };

            // Mock the API call using a mock value
            const mockSearchService = {
                doSearchByLabelCountQuery: jest
                    .fn()
                    .mockReturnValue(of(mockCountQueryResponse)),
            };

            // Set the mock search service in the service
            service['_dspApiConnection'] = {
                v2: { search: mockSearchService },
            } as unknown as KnoraApiConnection;

            service
                .getResourcesListCount(searchValue, resourceClassIri)
                .subscribe((count) => {
                    expect(count).toEqual(123);
                    done();
                });
        });

        it('should return a list of resources', (done) => {
            const searchValue = 'searchQuery'; // Replace with the desired search value
            const resourceClassIri = 'resource-class-1'; // Replace with the desired resource class IRI

            const res1 = new ReadResource();
            res1.id = 'resource1';
            res1.label = 'Resource 1';

            const res2 = new ReadResource();
            res2.id = 'resource2';
            res2.label = 'Resource 2';

            const mockResourceSequence = {
                resources: [res1, res2],
            };

            // Mock the API call using a mock value
            const mockSearchService = {
                doSearchByLabel: jest
                    .fn()
                    .mockReturnValue(of(mockResourceSequence)),
            };

            // Set the mock search service in the service
            service['_dspApiConnection'] = {
                v2: { search: mockSearchService },
            } as unknown as KnoraApiConnection;

            service
                .getResourcesList(searchValue, resourceClassIri)
                .subscribe((resources) => {
                    expect(resources).toEqual([
                        { iri: 'resource1', label: 'Resource 1' },
                        { iri: 'resource2', label: 'Resource 2' },
                    ]);
                    done();
                });
        });
    });

    describe('list', () => {
        it('should return the root list node of a list', (done) => {
            const rootNodeIri = 'http://rdfh.ch/lists/0420/6-Vp0F_1TfSS-DS_9q-Ucw';

            const mockListNode = {
                id: 'listNode1',
                label: 'List Node 1',
            };

            // Mock the API call using a mock value
            const mockListService = {
                getList: jest.fn().mockReturnValue(of(mockListNode)),
            };

            // Set the mock list service in the service
            service['_dspApiConnection'] = {
                v2: { list: mockListService },
            } as unknown as KnoraApiConnection;

            service.getList(rootNodeIri).subscribe((listNode) => {
                expect(listNode).toEqual(mockListNode);
                done();
            });
        });
    });
});
