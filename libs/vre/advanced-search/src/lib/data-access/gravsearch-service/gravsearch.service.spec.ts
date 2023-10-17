import { TestBed } from '@angular/core/testing';

import { GravsearchService } from './gravsearch.service';
import { Operators } from '../advanced-search-store/advanced-search-store.service';
import { ResourceLabel } from '../advanced-search-service/advanced-search.service';
import { Constants } from '@dasch-swiss/dsp-js';

describe('GravsearchService', () => {
    let service: GravsearchService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GravsearchService);
        expect(service).toBeTruthy();
    });

    describe('getGravsearchQuery', () => {
        it('should return a gravsearch query', () => {
            const query = service.generateGravSearchQuery(
                'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#test',
                [
                    {
                        id: 'd708083b-d670-46d8-a4ea-5c106ffa49b4',
                        operators: [Operators.Equals, Operators.NotEquals, Operators.IsLike, Operators.Matches],
                        selectedOperator: 'equals',
                        selectedProperty: {
                            iri: 'resourceLabel',
                            label: 'Resource Label',
                            objectType: ResourceLabel,
                            isLinkedResourceProperty: false,
                        },
                        searchValue: 'test',
                        list: undefined,
                    },
                    {
                        id: '555303d5-fd4f-4b71-8361-6d6abb8c9387',
                        operators: [Operators.Equals, Operators.NotEquals, Operators.Exists, Operators.NotExists, Operators.GreaterThan, Operators.GreaterThanEquals, Operators.LessThan, Operators.LessThanEquals],
                        selectedOperator: Operators.Exists,
                        selectedProperty: {
                            iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#int',
                            label: 'int',
                            objectType: Constants.IntValue,
                            isLinkedResourceProperty: false,
                        },
                        searchValue: 'test',
                        list: undefined,
                    },
                    {
                        id: '852c1fb3-2ed2-404c-9fe4-5ada9f97578f',
                        operators: [Operators.Equals, Operators.NotEquals, Operators.Exists, Operators.NotExists, Operators.GreaterThan, Operators.GreaterThanEquals, Operators.LessThan, Operators.LessThanEquals],
                        selectedOperator: Operators.LessThan,
                        selectedProperty: {
                            iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#dectest',
                            label: 'dectest',
                            objectType: Constants.DecimalValue,
                            isLinkedResourceProperty: false,
                        },
                        searchValue: '1',
                        list: undefined,
                    },
                ],
                [],
            );

            expect(query).toEqual(
`PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {
?mainRes knora-api:isMainResource true .

?mainRes <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#int> ?prop1 .
?mainRes <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#dectest> ?prop2 .
} WHERE {
?mainRes a knora-api:Resource .
?mainRes a <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#test> .

?mainRes rdfs:label ?labeld708083b .
FILTER (?labeld708083b = "test") .
?mainRes <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#int> ?prop1 .
?mainRes <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#dectest> ?prop2 .
?prop2 <http://api.knora.org/ontology/knora-api/v2#decimalValueAsDecimal> ?prop2Literal .
FILTER (?prop2Literal < "1"^^<http://www.w3.org/2001/XMLSchema#decimal>) .
}

OFFSET 0`
            );
        });

        it('should return a gravsearch query with a linked resource property and child properties', () => {
            const query = service.generateGravSearchQuery(
                'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#test',
                [
                    {
                        id: 'cbeca516-1a49-4a44-8435-c7d26d6198a9',
                        list: undefined,
                        operators: [Operators.Equals, Operators.NotEquals, Operators.Exists, Operators.NotExists, Operators.Matches],
                        searchValue: [
                            {
                                id: 'eccada6d-30ac-4e39-8a3a-540181ceac3c',
                                isChildProperty: true,
                                list: undefined,
                                operators: [Operators.Equals, Operators.NotEquals, Operators.Exists, Operators.NotExists, Operators.GreaterThan, Operators.GreaterThanEquals, Operators.LessThan, Operators.LessThanEquals],
                                searchValue: undefined,
                                selectedOperator: Operators.Exists,
                                selectedProperty:
                                {
                                    iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#int',
                                    isLinkedResourceProperty: false,
                                    label: 'int',
                                    objectType: Constants.IntValue,
                                },
                            },
                            {
                                id: '65a6a64e-db2c-4528-8c9d-e332b5bb1a3d',
                                isChildProperty: true,
                                list: undefined,
                                operators: [Operators.Equals, Operators.NotEquals, Operators.Exists, Operators.NotExists, Operators.GreaterThan, Operators.GreaterThanEquals, Operators.LessThan, Operators.LessThanEquals],
                                searchValue: '1',
                                selectedOperator: Operators.LessThan,
                                selectedProperty:
                                {
                                    iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#dectest',
                                    isLinkedResourceProperty: false,
                                    label: 'dectest',
                                    objectType: Constants.DecimalValue,
                                },
                            },
                        ],
                        selectedOperator: Operators.Matches,
                        selectedProperty: {
                            iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#linkToTest',
                            label: 'Link to Test',
                            objectType: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#test',
                            isLinkedResourceProperty: true,
                        },
                    }
                ],
                [],
            );

            expect(query).toEqual(
`PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {
?mainRes knora-api:isMainResource true .
?mainRes <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#linkToTest> ?prop0 .
?prop0 <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#int> ?linkProp00 .
?prop0 <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#dectest> ?linkProp01 .
} WHERE {
?mainRes a knora-api:Resource .
?mainRes a <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#test> .
?mainRes <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#linkToTest> ?prop0 .
?prop0 <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#int> ?linkProp00 .

?prop0 <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#dectest> ?linkProp01 .

?linkProp01 <http://api.knora.org/ontology/knora-api/v2#decimalValueAsDecimal> ?linkProp01Literal .
FILTER (?linkProp01Literal < "1"^^<http://www.w3.org/2001/XMLSchema#decimal>) .
}

OFFSET 0`
                );
        });

        it('should return a gravsearch query with an order by statement', () => {
            const query = service.generateGravSearchQuery(
                'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#test',
                [
                    {
                        id: '83fa06a4-a7bf-4e23-bcda-30c70777d761',
                        operators: [Operators.Equals, Operators.NotEquals, Operators.IsLike, Operators.Matches],
                        selectedOperator: 'equals',
                        selectedProperty: {
                            iri: 'resourceLabel',
                            label: 'Resource Label',
                            objectType: ResourceLabel,
                            isLinkedResourceProperty: false,
                        },
                        searchValue: 'test',
                        list: undefined,
                    },
                    {
                        id: '8d0299df-e50d-498d-8988-93075309362f',
                        operators: [Operators.Equals, Operators.NotEquals, Operators.Exists, Operators.NotExists, Operators.GreaterThan, Operators.GreaterThanEquals, Operators.LessThan, Operators.LessThanEquals],
                        selectedOperator: Operators.Exists,
                        selectedProperty: {
                            iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#int',
                            label: 'int',
                            objectType: Constants.IntValue,
                            isLinkedResourceProperty: false,
                        },
                        searchValue: 'test',
                        list: undefined,
                    },
                    {
                        id: '82adaab4-dec0-46f5-900d-e97bec78a0c3',
                        operators: [Operators.Equals, Operators.NotEquals, Operators.Exists, Operators.NotExists, Operators.GreaterThan, Operators.GreaterThanEquals, Operators.LessThan, Operators.LessThanEquals],
                        selectedOperator: Operators.LessThan,
                        selectedProperty: {
                            iri: 'http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#dectest',
                            label: 'dectest',
                            objectType: Constants.DecimalValue,
                            isLinkedResourceProperty: false,
                        },
                        searchValue: '1',
                        list: undefined,
                    },
                ],
                [
                    {
                        id: '8d0299df-e50d-498d-8988-93075309362f',
                        label: 'int',
                        orderBy: true
                    },
                    {
                        id: '83fa06a4-a7bf-4e23-bcda-30c70777d761',
                        label: 'test',
                        orderBy: true
                    },
                    {
                        id: '82adaab4-dec0-46f5-900d-e97bec78a0c3',
                        label: 'dectest',
                        orderBy: true
                    },
                ],
            );

            expect(query).toEqual(
`PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {
?mainRes knora-api:isMainResource true .

?mainRes <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#int> ?prop1 .
?mainRes <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#dectest> ?prop2 .
} WHERE {
?mainRes a knora-api:Resource .
?mainRes a <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#test> .

?mainRes rdfs:label ?label83fa06a4 .
FILTER (?label83fa06a4 = "test") .
?mainRes <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#int> ?prop1 .
?mainRes <http://api.test.dasch.swiss/ontology/0420/eric-onto/v2#dectest> ?prop2 .
?prop2 <http://api.knora.org/ontology/knora-api/v2#decimalValueAsDecimal> ?prop2Literal .
FILTER (?prop2Literal < "1"^^<http://www.w3.org/2001/XMLSchema#decimal>) .
}
ORDER BY ?prop1 ?label83fa06a4 ?prop2
OFFSET 0`
            );
        });
    });
});
