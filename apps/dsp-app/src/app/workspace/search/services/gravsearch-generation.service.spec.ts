/* eslint-disable max-len */
import { GravsearchGenerationService } from './gravsearch-generation.service';
import {
    AdvancedSearchParams,
    AdvancedSearchParamsService,
} from './advanced-search-params.service';
import { TestBed } from '@angular/core/testing';
import { MockOntology, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import {
    ComparisonOperatorAndValue,
    Equals,
    Exists,
    GreaterThan,
    GreaterThanEquals,
    IRI,
    LessThan,
    LessThanEquals,
    Like,
    LinkedResource,
    Match,
    NotEquals,
    NotExists,
    PropertyWithValue,
    ValueLiteral,
} from '../advanced-search/resource-and-property-selection/search-select-property/specify-property-value/operator';

describe('GravsearchGenerationService', () => {
    let gravSearchGenerationServ: GravsearchGenerationService;
    let searchParamsServiceSpy: jasmine.SpyObj<AdvancedSearchParamsService>; // see https://angular.io/guide/testing#angular-testbed
    let advancedSearchParams: AdvancedSearchParams;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('SearchParamsService', [
            'changeSearchParamsMsg',
        ]);

        TestBed.configureTestingModule({
            providers: [
                { provide: AdvancedSearchParamsService, useValue: spy },
            ],
        });

        gravSearchGenerationServ = TestBed.inject(GravsearchGenerationService);
        searchParamsServiceSpy = TestBed.inject(
            AdvancedSearchParamsService
        ) as jasmine.SpyObj<AdvancedSearchParamsService>;
        searchParamsServiceSpy.changeSearchParamsMsg.and.callFake(
            (searchParams: AdvancedSearchParams) => {
                advancedSearchParams = searchParams;
            }
        );
    });

    it('should be created', () => {
        expect(gravSearchGenerationServ).toBeTruthy();
    });

    it('Gravsearch query string with TEXT property matching a value using LIKE', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Like(),
            new ValueLiteral('edition', 'http://www.w3.org/2001/XMLSchema#string')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasText> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasText> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#valueAsString> ?propVal0Literal
FILTER regex(?propVal0Literal, "edition"^^<http://www.w3.org/2001/XMLSchema#string>, "i")


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with TEXT property matching a value using MATCH', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Match(),
            new ValueLiteral('book', 'http://www.w3.org/2001/XMLSchema#string')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasText> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasText> ?propVal0 .



FILTER <http://api.knora.org/ontology/knora-api/v2#matchText>(?propVal0, "book"^^<http://www.w3.org/2001/XMLSchema#string>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with TEXT property equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Equals(),
            new ValueLiteral('science', 'http://www.w3.org/2001/XMLSchema#string')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasText> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasText> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#valueAsString> ?propVal0Literal
FILTER(?propVal0Literal = "science"^^<http://www.w3.org/2001/XMLSchema#string>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with TEXT property not equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotEquals(),
            new ValueLiteral('data', 'http://www.w3.org/2001/XMLSchema#string')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasText> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasText> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#valueAsString> ?propVal0Literal
FILTER(?propVal0Literal != "data"^^<http://www.w3.org/2001/XMLSchema#string>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with existing TEXT property value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Exists(),
            new ValueLiteral(undefined, 'http://www.w3.org/2001/XMLSchema#string')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasText> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasText> ?propVal0 .






}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with no existing TEXT property values', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotExists(),
            new ValueLiteral(undefined, 'http://www.w3.org/2001/XMLSchema#string')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasText> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .

FILTER NOT EXISTS {
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasText> ?propVal0 .


}



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with BOOLEAN property equaling "true"', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Equals(),
            new ValueLiteral('true', 'http://www.w3.org/2001/XMLSchema#boolean')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#booleanValueAsBoolean> ?propVal0Literal
FILTER(?propVal0Literal = "true"^^<http://www.w3.org/2001/XMLSchema#boolean>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with existing BOOLEAN property value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Exists(),
            new ValueLiteral(undefined, 'http://www.w3.org/2001/XMLSchema#boolean')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean> ?propVal0 .






}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with no existing BOOLEAN property values', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotExists(),
            new ValueLiteral(undefined, 'http://www.w3.org/2001/XMLSchema#boolean')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .

FILTER NOT EXISTS {
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean> ?propVal0 .


}



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with URI property equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Equals(),
            new ValueLiteral('https://www.dasch.swiss', 'http://www.w3.org/2001/XMLSchema#anyURI')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#uriValueAsUri> ?propVal0Literal
FILTER(?propVal0Literal = "https://www.dasch.swiss"^^<http://www.w3.org/2001/XMLSchema#anyURI>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with URI property not equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotEquals(),
            new ValueLiteral('https://www.dasch.swiss', 'http://www.w3.org/2001/XMLSchema#anyURI')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#uriValueAsUri> ?propVal0Literal
FILTER(?propVal0Literal != "https://www.dasch.swiss"^^<http://www.w3.org/2001/XMLSchema#anyURI>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with existing URI property value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Exists(),
            new ValueLiteral('http://www.google.ch', 'http://www.w3.org/2001/XMLSchema#anyURI')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri> ?propVal0 .






}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with no existing URI property values', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotExists(),
            new ValueLiteral('http://www.google.ch', 'http://www.w3.org/2001/XMLSchema#anyURI')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .

FILTER NOT EXISTS {
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri> ?propVal0 .


}



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with INT property equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Equals(),
            new ValueLiteral('10', 'http://www.w3.org/2001/XMLSchema#integer')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#intValueAsInt> ?propVal0Literal
FILTER(?propVal0Literal = "10"^^<http://www.w3.org/2001/XMLSchema#integer>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with INT property not equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotEquals(),
            new ValueLiteral('10', 'http://www.w3.org/2001/XMLSchema#integer')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#intValueAsInt> ?propVal0Literal
FILTER(?propVal0Literal != "10"^^<http://www.w3.org/2001/XMLSchema#integer>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with INT property less than a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new LessThan(),
            new ValueLiteral('5', 'http://www.w3.org/2001/XMLSchema#integer')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#intValueAsInt> ?propVal0Literal
FILTER(?propVal0Literal < "5"^^<http://www.w3.org/2001/XMLSchema#integer>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with INT property less than equal a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new LessThanEquals(),
            new ValueLiteral('5', 'http://www.w3.org/2001/XMLSchema#integer')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#intValueAsInt> ?propVal0Literal
FILTER(?propVal0Literal <= "5"^^<http://www.w3.org/2001/XMLSchema#integer>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with INT property greater than a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new GreaterThan(),
            new ValueLiteral('6', 'http://www.w3.org/2001/XMLSchema#integer')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#intValueAsInt> ?propVal0Literal
FILTER(?propVal0Literal > "6"^^<http://www.w3.org/2001/XMLSchema#integer>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with INT property greater than equal a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new GreaterThanEquals(),
            new ValueLiteral('6', 'http://www.w3.org/2001/XMLSchema#integer')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#intValueAsInt> ?propVal0Literal
FILTER(?propVal0Literal >= "6"^^<http://www.w3.org/2001/XMLSchema#integer>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with existing INT property value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Exists(),
            new ValueLiteral(undefined, 'http://www.w3.org/2001/XMLSchema#integer')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .






}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with no existing INT property values', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotExists(),
            new ValueLiteral(undefined, 'http://www.w3.org/2001/XMLSchema#integer')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .

FILTER NOT EXISTS {
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .


}



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with DECIMAL property equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Equals(),
            new ValueLiteral('4.5', 'http://www.w3.org/2001/XMLSchema#decimal')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#decimalValueAsDecimal> ?propVal0Literal
FILTER(?propVal0Literal = "4.5"^^<http://www.w3.org/2001/XMLSchema#decimal>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with DECIMAL property not equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotEquals(),
            new ValueLiteral('4.5', 'http://www.w3.org/2001/XMLSchema#decimal')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#decimalValueAsDecimal> ?propVal0Literal
FILTER(?propVal0Literal != "4.5"^^<http://www.w3.org/2001/XMLSchema#decimal>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with DECIMAL property less than a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new LessThan(),
            new ValueLiteral('12.3', 'http://www.w3.org/2001/XMLSchema#decimal')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#decimalValueAsDecimal> ?propVal0Literal
FILTER(?propVal0Literal < "12.3"^^<http://www.w3.org/2001/XMLSchema#decimal>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with DECIMAL property less than equal a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new LessThanEquals(),
            new ValueLiteral('9.6', 'http://www.w3.org/2001/XMLSchema#decimal')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#decimalValueAsDecimal> ?propVal0Literal
FILTER(?propVal0Literal <= "9.6"^^<http://www.w3.org/2001/XMLSchema#decimal>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with DECIMAL property greater than a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new GreaterThan(),
            new ValueLiteral('1.7', 'http://www.w3.org/2001/XMLSchema#decimal')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#decimalValueAsDecimal> ?propVal0Literal
FILTER(?propVal0Literal > "1.7"^^<http://www.w3.org/2001/XMLSchema#decimal>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with DECIMAL property greater than equal a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new GreaterThanEquals(),
            new ValueLiteral('2.4', 'http://www.w3.org/2001/XMLSchema#decimal')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#decimalValueAsDecimal> ?propVal0Literal
FILTER(?propVal0Literal >= "2.4"^^<http://www.w3.org/2001/XMLSchema#decimal>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with existing DECIMAL property value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Exists(),
            new ValueLiteral(undefined, 'http://www.w3.org/2001/XMLSchema#decimal')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .






}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with no existing DECIMAL property values', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotExists(),
            new ValueLiteral(undefined, 'http://www.w3.org/2001/XMLSchema#decimal')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .

FILTER NOT EXISTS {
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal0 .


}



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with DATE property equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Equals(),
            new ValueLiteral('GREGORIAN:2020-6-3:2020-6-3', 'http://api.knora.org/ontology/knora-api/simple/v2#Date')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .



FILTER(knora-api:toSimpleDate(?propVal0) = "GREGORIAN:2020-6-3:2020-6-3"^^<http://api.knora.org/ontology/knora-api/simple/v2#Date>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with DATE property not equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotEquals(),
            new ValueLiteral('GREGORIAN:2019-12-14:2019-12-14', 'http://api.knora.org/ontology/knora-api/simple/v2#Date')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .



FILTER(knora-api:toSimpleDate(?propVal0) != "GREGORIAN:2019-12-14:2019-12-14"^^<http://api.knora.org/ontology/knora-api/simple/v2#Date>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with DATE property less than a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new LessThan(),
            new ValueLiteral('GREGORIAN:2022-2-2:2022-2-2', 'http://api.knora.org/ontology/knora-api/simple/v2#Date')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .



FILTER(knora-api:toSimpleDate(?propVal0) < "GREGORIAN:2022-2-2:2022-2-2"^^<http://api.knora.org/ontology/knora-api/simple/v2#Date>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with DATE property less than equal a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new LessThanEquals(),
            new ValueLiteral('GREGORIAN:2022-2-2:2022-2-2', 'http://api.knora.org/ontology/knora-api/simple/v2#Date')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .



FILTER(knora-api:toSimpleDate(?propVal0) <= "GREGORIAN:2022-2-2:2022-2-2"^^<http://api.knora.org/ontology/knora-api/simple/v2#Date>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with DATE property greater than a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new GreaterThan(),
            new ValueLiteral('GREGORIAN:1996-4-8:1996-4-8', 'http://api.knora.org/ontology/knora-api/simple/v2#Date')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .



FILTER(knora-api:toSimpleDate(?propVal0) > "GREGORIAN:1996-4-8:1996-4-8"^^<http://api.knora.org/ontology/knora-api/simple/v2#Date>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with DATE property greater than equal a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new GreaterThanEquals(),
            new ValueLiteral('GREGORIAN:1996-4-8:1996-4-8', 'http://api.knora.org/ontology/knora-api/simple/v2#Date')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .



FILTER(knora-api:toSimpleDate(?propVal0) >= "GREGORIAN:1996-4-8:1996-4-8"^^<http://api.knora.org/ontology/knora-api/simple/v2#Date>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with existing DATE property value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Exists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/simple/v2#Date')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .






}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with no existing DATE property values', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotExists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/simple/v2#Date')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing', 0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .

FILTER NOT EXISTS {
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .


}



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with LINK property matching a value (resource type) using MATCH', () => {

        const linkedResource = new LinkedResource([], 'http://0.0.0.0:3333/ontology/0001/anything/v2#LinkedThing');

        const mainProp = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing'
        ];

        const mainResValue = new ComparisonOperatorAndValue(new Match(), linkedResource);
        const mainResPropWithVal = new PropertyWithValue(mainProp as ResourcePropertyDefinition, mainResValue, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [mainResPropWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing> ?linkedRes00 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing> ?linkedRes00 .




?linkedRes00 a <http://0.0.0.0:3333/ontology/0001/anything/v2#LinkedThing> .



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with LINK property equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Equals(),
            new IRI('http://rdfh.ch/0001/thing_with_richtext_with_markup')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing> <http://rdfh.ch/0001/thing_with_richtext_with_markup> .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing> <http://rdfh.ch/0001/thing_with_richtext_with_markup> .






}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with LINK property not equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotEquals(),
            new IRI('http://rdfh.ch/0001/thing_with_richtext_with_markup')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .



} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .

FILTER NOT EXISTS {
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing> <http://rdfh.ch/0001/thing_with_richtext_with_markup> .


}



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with existing LINK property value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Exists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/v2#Resource')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing> ?propVal0 .






}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with no existing LINK property values', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotExists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/v2#Resource')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery([propWithVal], 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing', 0);

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .

FILTER NOT EXISTS {
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing> ?propVal0 .


}



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with LIST property equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Equals(),
            new IRI('http://rdfh.ch/lists/0001/treeList')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#listValueAsListNode> <http://rdfh.ch/lists/0001/treeList> .



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with LIST property not equaling a value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotEquals(),
            new IRI('http://rdfh.ch/lists/0001/treeList')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem> ?propVal0 .



FILTER NOT EXISTS {
?propVal0 <http://api.knora.org/ontology/knora-api/v2#listValueAsListNode> <http://rdfh.ch/lists/0001/treeList> .

}


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with existing LIST property value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Exists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/v2#ListValue')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem> ?propVal0 .






}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with no existing LIST property values', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotExists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/v2#ListValue')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .

FILTER NOT EXISTS {
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem> ?propVal0 .


}



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with existing COLOR property value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasColor'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Exists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/v2#ColorValue')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasColor> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasColor> ?propVal0 .






}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with no existing COLOR property values', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasColor'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotExists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/v2#ColorValue')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery([propWithVal], 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing', 0);

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasColor> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .

FILTER NOT EXISTS {
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasColor> ?propVal0 .


}



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with existing INTERVAL property value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInterval'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Exists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/v2#IntervalValue')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInterval> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInterval> ?propVal0 .






}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with no existing INTERVAL property values', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInterval'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotExists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/v2#IntervalValue')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInterval> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .

FILTER NOT EXISTS {
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInterval> ?propVal0 .


}



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with existing GEONAME property value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasGeoname'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Exists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/v2#GeonameValue')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasGeoname> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasGeoname> ?propVal0 .






}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with no existing GEONAME property values', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasGeoname'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotExists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/v2#GeonameValue')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasGeoname> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .

FILTER NOT EXISTS {
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasGeoname> ?propVal0 .


}



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(searchParamsServiceSpy.changeSearchParamsMsg).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with existing TIMESTAMP property value', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new Exists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/v2#TimeValue')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp> ?propVal0 .






}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with no existing TIMEPSTAMP property values', () => {
        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new NotExists(),
            new ValueLiteral(undefined, 'http://api.knora.org/ontology/knora-api/v2#TimeValue')
        );

        const propWithVal = new PropertyWithValue(prop, value, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .

FILTER NOT EXISTS {
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp> ?propVal0 .


}



}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });

    it('Gravsearch query string with restriction to a resource class using offset 1', () => {

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            1
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .



} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .



}

OFFSET 1
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(0);

    });

    it('Gravsearch query string with an integer property matching a value using MATCH and use it as a sort criterion', () => {

        const prop = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
        ] as ResourcePropertyDefinition;

        const value = new ComparisonOperatorAndValue(
            new LessThan(),
            new ValueLiteral('1', 'http://www.w3.org/2001/XMLSchema#integer')
        );

        const propWithVal = new PropertyWithValue(prop, value, true);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal],
            undefined,
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .

} WHERE {

?mainRes a knora-api:Resource .




?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVal0 .



?propVal0 <http://api.knora.org/ontology/knora-api/v2#intValueAsInt> ?propVal0Literal
FILTER(?propVal0Literal < "1"^^<http://www.w3.org/2001/XMLSchema#integer>)


}

ORDER BY ?propVal0

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);

    });

    it('should create a Gravsearch query string with a date property matching a value used as a sort criterion and an decimal property also used as a sort criterion', () => {

        const prop1 = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate'
        ] as ResourcePropertyDefinition;

        const value1 = new ComparisonOperatorAndValue(
            new LessThan(),
            new ValueLiteral('GREGORIAN:2019-02-02', 'http://api.knora.org/ontology/knora-api/simple/v2#Date')
        );

        const propWithVal1 = new PropertyWithValue(prop1, value1, true);

        const prop2 = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal'
        ] as ResourcePropertyDefinition;

        const value2 = new ComparisonOperatorAndValue(
            new GreaterThan(),
            new ValueLiteral('0.1', 'http://www.w3.org/2001/XMLSchema#decimal')
        );

        const propWithVal2 = new PropertyWithValue(prop2, value2, true);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [propWithVal1, propWithVal2],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .
?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal1 .

} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate> ?propVal0 .



FILTER(knora-api:toSimpleDate(?propVal0) < "GREGORIAN:2019-02-02"^^<http://api.knora.org/ontology/knora-api/simple/v2#Date>)

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVal1 .



?propVal1 <http://api.knora.org/ontology/knora-api/v2#decimalValueAsDecimal> ?propVal1Literal
FILTER(?propVal1Literal > "0.1"^^<http://www.w3.org/2001/XMLSchema#decimal>)


}

ORDER BY ?propVal0 ?propVal1

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);

    });

    it('search for a specified linked resource specified by one prop', () => {

        const anythingOnto = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');

        const hasDecimal = anythingOnto.properties['http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal'];
        const linkedResValue = new ComparisonOperatorAndValue(
            new GreaterThan(),
            new ValueLiteral('0.5', 'http://www.w3.org/2001/XMLSchema#decimal')
        );

        const linkedResourceWithVal = new PropertyWithValue(hasDecimal as ResourcePropertyDefinition, linkedResValue, false);

        const linkedResource = new LinkedResource(
            [linkedResourceWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
        );

        const mainProp = anythingOnto.properties['http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing'];
        const mainResValue = new ComparisonOperatorAndValue(new Match(), linkedResource);
        const mainResPropWithVal = new PropertyWithValue(mainProp as ResourcePropertyDefinition, mainResValue, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [mainResPropWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing> ?linkedRes00 .
?linkedRes00 <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVallinkedRes000 .




} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing> ?linkedRes00 .
?linkedRes00 <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVallinkedRes000 .







?linkedRes00 a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .
?propVallinkedRes000 <http://api.knora.org/ontology/knora-api/v2#decimalValueAsDecimal> ?propVallinkedRes000Literal
FILTER(?propVallinkedRes000Literal > "0.5"^^<http://www.w3.org/2001/XMLSchema#decimal>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);

    });

    it('search for a specified linked resource specified by two props', () => {

        const anythingOnto = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');

        const hasDecimal = anythingOnto.properties['http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal'];
        const linkedResDecValue = new ComparisonOperatorAndValue(
            new GreaterThan(),
            new ValueLiteral('0.5', 'http://www.w3.org/2001/XMLSchema#decimal')
        );

        const linkedResourceWithDecVal = new PropertyWithValue(hasDecimal as ResourcePropertyDefinition, linkedResDecValue, false);

        const hasInt = anythingOnto.properties['http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'];
        const linkedResIntValue = new ComparisonOperatorAndValue(
            new Equals(),
            new ValueLiteral('1', 'http://www.w3.org/2001/XMLSchema#integer')
        );

        const linkedResourceWithIntVal = new PropertyWithValue(hasInt as ResourcePropertyDefinition, linkedResIntValue, false);

        const linkedResource = new LinkedResource(
            [linkedResourceWithDecVal, linkedResourceWithIntVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
        );

        const mainProp = anythingOnto.properties['http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing'];
        const mainResValue = new ComparisonOperatorAndValue(new Match(), linkedResource);
        const mainResPropWithVal = new PropertyWithValue(mainProp as ResourcePropertyDefinition, mainResValue, false);

        const gravsearch = gravSearchGenerationServ.createGravsearchQuery(
            [mainResPropWithVal],
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            0
        );

        const expectedGravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing> ?linkedRes00 .
?linkedRes00 <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVallinkedRes000 .



?linkedRes00 <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVallinkedRes001 .




} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .


?mainRes <http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing> ?linkedRes00 .
?linkedRes00 <http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal> ?propVallinkedRes000 .



?linkedRes00 <http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger> ?propVallinkedRes001 .







?linkedRes00 a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .
?propVallinkedRes000 <http://api.knora.org/ontology/knora-api/v2#decimalValueAsDecimal> ?propVallinkedRes000Literal
FILTER(?propVallinkedRes000Literal > "0.5"^^<http://www.w3.org/2001/XMLSchema#decimal>)
?propVallinkedRes001 <http://api.knora.org/ontology/knora-api/v2#intValueAsInt> ?propVallinkedRes001Literal
FILTER(?propVallinkedRes001Literal = "1"^^<http://www.w3.org/2001/XMLSchema#integer>)


}

OFFSET 0
`;

        expect(gravsearch).toEqual(expectedGravsearch);
        expect(
            searchParamsServiceSpy.changeSearchParamsMsg
        ).toHaveBeenCalledTimes(1);
    });
});
