import { of } from 'rxjs';
import { AjaxError } from 'rxjs/ajax';
import { ListNodeV2Cache } from '../../../cache/ListNodeV2Cache';
import { OntologyCache } from '../../../cache/ontology-cache/OntologyCache';
import { MockList } from '../../../../test/data/api/v2/mock-list';
import { MockOntology } from '../../../../test/data/api/v2/mock-ontology';
import { setupAjaxMock, AjaxMock } from '../../../../test/ajax-mock-helper';
import { KnoraApiConfig } from '../../../knora-api-config';
import { KnoraApiConnection } from '../../../knora-api-connection';
import { ApiResponseError } from '../../../models/api-response-error';
import { ReadResourceSequence } from '../../../models/v2/resources/read/read-resource-sequence';
import { CountQueryResponse } from '../../../models/v2/search/count-query-response';
import { SearchEndpointV2 } from './search-endpoint-v2';

describe('SearchEndpoint', () => {
  const config = new KnoraApiConfig('http', '0.0.0.0', 3333, undefined, '', true);
  let knoraApiConnection: KnoraApiConnection;

  let getResourceClassSpy: jest.SpyInstance;

  let getListNodeFromCacheSpy: jest.SpyInstance;

  let ajaxMock: AjaxMock;

  beforeEach(() => {
    ajaxMock = setupAjaxMock();

    // Mock cache methods at the prototype level
    // This ensures ALL cache instances (including temporary ones) get the mocks
    getResourceClassSpy = jest
      .spyOn(OntologyCache.prototype, 'getResourceClassDefinition')
      .mockImplementation((resClassIri: string) =>
        of(MockOntology.mockIResourceClassAndPropertyDefinitions(resClassIri))
      );

    getListNodeFromCacheSpy = jest
      .spyOn(ListNodeV2Cache.prototype, 'getNode')
      .mockImplementation((listNodeIri: string) => of(MockList.mockNode(listNodeIri)));

    knoraApiConnection = new KnoraApiConnection(config);
  });

  afterEach(() => {
    ajaxMock.cleanup();
    getResourceClassSpy.mockRestore();
    getListNodeFromCacheSpy.mockRestore();
  });

  describe('Fulltext search', () => {
    it('should handle parameters correctly', () => {
      expect(SearchEndpointV2['encodeFulltextParams'](0)).toEqual('?offset=0');

      expect(SearchEndpointV2['encodeFulltextParams'](1)).toEqual('?offset=1');

      expect(SearchEndpointV2['encodeFulltextParams'](0, { limitToProject: 'http://rdfh.ch/projects/0001' })).toEqual(
        '?offset=0&limitToProject=http%3A%2F%2Frdfh.ch%2Fprojects%2F0001'
      );

      expect(
        SearchEndpointV2['encodeFulltextParams'](0, {
          limitToResourceClass: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
        })
      ).toEqual('?offset=0&limitToResourceClass=http%3A%2F%2F0.0.0.0%3A3333%2Fontology%2F0001%2Fanything%2Fv2%23Thing');

      expect(
        SearchEndpointV2['encodeFulltextParams'](0, {
          limitToStandoffClass: 'http://api.knora.org/ontology/standoff/v2#StandoffParagraphTag',
        })
      ).toEqual(
        '?offset=0&limitToStandoffClass=http%3A%2F%2Fapi.knora.org%2Fontology%2Fstandoff%2Fv2%23StandoffParagraphTag'
      );

      expect(
        SearchEndpointV2['encodeFulltextParams'](0, {
          limitToProject: 'http://rdfh.ch/projects/0001',
          limitToResourceClass: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
        })
      ).toEqual(
        '?offset=0&limitToResourceClass=http%3A%2F%2F0.0.0.0%3A3333%2Fontology%2F0001%2Fanything%2Fv2%23Thing&limitToProject=http%3A%2F%2Frdfh.ch%2Fprojects%2F0001'
      );

      expect(
        SearchEndpointV2['encodeFulltextParams'](0, {
          limitToProject: 'http://rdfh.ch/projects/0001',
          limitToResourceClass: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
          limitToStandoffClass: 'http://api.knora.org/ontology/standoff/v2#StandoffParagraphTag',
        })
      ).toEqual(
        '?offset=0&limitToResourceClass=http%3A%2F%2F0.0.0.0%3A3333%2Fontology%2F0001%2Fanything%2Fv2%23Thing&limitToProject=http%3A%2F%2Frdfh.ch%2Fprojects%2F0001&limitToStandoffClass=http%3A%2F%2Fapi.knora.org%2Fontology%2Fstandoff%2Fv2%23StandoffParagraphTag'
      );
    });

    it('should do a fulltext search with a simple search term', done => {
      const resource = require('../../../../test/data/api/v2/resources/things.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search.doFulltextSearch('thing', 0).subscribe((response: ReadResourceSequence) => {
        expect(response.resources.length).toEqual(2);

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe('http://0.0.0.0:3333/v2/search/thing?offset=0');

        expect(request?.method).toEqual('GET');

        done();
      });
    });

    it('should unsuccessfully attempt to do a fulltext search with a simple search term', done => {
      ajaxMock.setMockError({}, 400);

      knoraApiConnection.v2.search.doFulltextSearch('thing', 0).subscribe(
        (response: ReadResourceSequence) => {},
        (err: ApiResponseError) => {
          expect(err instanceof ApiResponseError).toBeTruthy();
          expect(err.status).toEqual(400);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://0.0.0.0:3333/v2/search/thing?offset=0');

          expect(request?.method).toEqual('GET');

          done();
        }
      );
    });

    it('should do a fulltext search with a simple search term using offset 1', done => {
      const resource = require('../../../../test/data/api/v2/resources/things.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search.doFulltextSearch('thing', 1).subscribe((response: ReadResourceSequence) => {
        expect(response.resources.length).toEqual(2);

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe('http://0.0.0.0:3333/v2/search/thing?offset=1');

        expect(request?.method).toEqual('GET');

        done();
      });
    });

    it('should do a fulltext search with a simple search term restricting the search to a specific resource class', done => {
      const resource = require('../../../../test/data/api/v2/resources/things.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search
        .doFulltextSearch('thing', 1, { limitToResourceClass: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing' })
        .subscribe((response: ReadResourceSequence) => {
          expect(response.resources.length).toEqual(2);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toEqual(
            'http://0.0.0.0:3333/v2/search/thing?offset=1&limitToResourceClass=http%3A%2F%2F0.0.0.0%3A3333%2Fontology%2F0001%2Fanything%2Fv2%23Thing'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should do a fulltext search with a simple search term restricting the search to a specific project', done => {
      const resource = require('../../../../test/data/api/v2/resources/things.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search
        .doFulltextSearch('thing', 1, { limitToProject: 'http://rdfh.ch/projects/0001' })
        .subscribe((response: ReadResourceSequence) => {
          expect(response.resources.length).toEqual(2);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toEqual(
            'http://0.0.0.0:3333/v2/search/thing?offset=1&limitToProject=http%3A%2F%2Frdfh.ch%2Fprojects%2F0001'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should do a fulltext search with a simple search term restricting the search to a specific standoff class', done => {
      const resource = require('../../../../test/data/api/v2/resources/things.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search
        .doFulltextSearch('thing', 1, {
          limitToStandoffClass: 'http://api.knora.org/ontology/standoff/v2#StandoffParagraphTag',
        })
        .subscribe((response: ReadResourceSequence) => {
          expect(response.resources.length).toEqual(2);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toEqual(
            'http://0.0.0.0:3333/v2/search/thing?offset=1&limitToStandoffClass=http%3A%2F%2Fapi.knora.org%2Fontology%2Fstandoff%2Fv2%23StandoffParagraphTag'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  it('should do a fulltext count search with a simple search term', done => {
    const resource = require('../../../../test/data/api/v2/search/count-query-result.json');

    ajaxMock.setMockResponse(resource);

    knoraApiConnection.v2.search.doFulltextSearchCountQuery('thing', 0).subscribe((response: CountQueryResponse) => {
      expect(response.numberOfResults).toEqual(2);

      const request = ajaxMock.getLastRequest();

      expect(request?.url).toBe('http://0.0.0.0:3333/v2/search/count/thing?offset=0');

      expect(request?.method).toEqual('GET');

      done();
    });
  });

  describe('Incoming links endpoint', () => {
    const resourceIri = 'http://rdfh.ch/0001/a-thing';
    it('should perform a successful incoming links search', done => {
      const resource = require('../../../../test/data/api/v2/resources/things.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search.doSearchIncomingLinks(resourceIri).subscribe(response => {
        expect(response.resources.length).toEqual(2);

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://0.0.0.0:3333/v2/searchIncomingLinks/http%3A%2F%2Frdfh.ch%2F0001%2Fa-thing?offset=0'
        );
        expect(request?.method).toEqual('GET');

        done();
      });
    });
  });

  describe('StillImageRepresentations endpoints', () => {
    const resourceIri = 'http://rdfh.ch/0001/a-thing-picture';
    it('should perform a successful StillImageRepresentations search', done => {
      const resource = require('../../../../test/data/api/v2/resources/things.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search.doSearchStillImageRepresentations(resourceIri).subscribe(response => {
        expect(response.resources.length).toEqual(2);

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://0.0.0.0:3333/v2/searchStillImageRepresentations/http%3A%2F%2Frdfh.ch%2F0001%2Fa-thing-picture?offset=0'
        );
        expect(request?.method).toEqual('GET');

        done();
      });
    });

    it('should perform a successful StillImageRepresentationsCount search', done => {
      const resource = require('../../../../test/data/api/v2/search/count-query-result.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search
        .doSearchStillImageRepresentationsCount(resourceIri)
        .subscribe((response: CountQueryResponse) => {
          expect(response.numberOfResults).toEqual(2);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/searchStillImageRepresentationsCount/http%3A%2F%2Frdfh.ch%2F0001%2Fa-thing-picture'
          );
          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Incoming regions endpoint', () => {
    const resourceIri = 'http://rdfh.ch/0001/a-thing-picture';
    it('should perform a successful incoming regions search', done => {
      const resource = require('../../../../test/data/api/v2/resources/things.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search.doSearchIncomingRegions(resourceIri).subscribe(response => {
        expect(response.resources.length).toEqual(2);

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://0.0.0.0:3333/v2/searchIncomingRegions/http%3A%2F%2Frdfh.ch%2F0001%2Fa-thing-picture?offset=0'
        );
        expect(request?.method).toEqual('GET');

        done();
      });
    });
  });

  describe('Extended search', () => {
    it('should perform an extended search', done => {
      const gravsearchQuery = `
                PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
                CONSTRUCT {

                    ?mainRes knora-api:isMainResource true .

                } WHERE {

                    ?mainRes a knora-api:Resource .

                    ?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .
                }

                OFFSET 0
            `;

      const resource = require('../../../../test/data/api/v2/resources/things.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search.doExtendedSearch(gravsearchQuery).subscribe((response: ReadResourceSequence) => {
        expect(response.resources.length).toEqual(2);

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe('http://0.0.0.0:3333/v2/searchextended');

        expect(request?.method).toEqual('POST');

        expect(request?.headers?.['Content-Type']).toEqual('application/sparql-query; charset=utf-8');

        expect(request?.body).toEqual(gravsearchQuery);

        done();
      });
    });

    it('should unsuccessfully attempt to perform an extended search', done => {
      const gravsearchQuery = `
                PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
                CONSTRUCT {

                    ?mainRes knora-api:isMainResource true .

                } WHERE {

                    ?mainRes a knora-api:Resource .

                    ?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .
                }

                OFFSET 0
            `;

      ajaxMock.setMockError({}, 400);

      knoraApiConnection.v2.search.doExtendedSearch(gravsearchQuery).subscribe(
        (response: ReadResourceSequence) => {},
        (err: ApiResponseError) => {
          expect(err instanceof ApiResponseError).toBeTruthy();
          expect(err.status).toEqual(400);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://0.0.0.0:3333/v2/searchextended');

          expect(request?.method).toEqual('POST');

          expect(request?.headers?.['Content-Type']).toEqual('application/sparql-query; charset=utf-8');

          expect(request?.body).toEqual(gravsearchQuery);

          done();
        }
      );
    });

    it('should perform an extended search count query', done => {
      const gravsearchQuery = `
                PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
                CONSTRUCT {

                    ?mainRes knora-api:isMainResource true .

                } WHERE {

                    ?mainRes a knora-api:Resource .

                    ?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .
                }

                OFFSET 0
            `;

      const resource = require('../../../../test/data/api/v2/search/count-query-result.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search
        .doExtendedSearchCountQuery(gravsearchQuery)
        .subscribe((response: CountQueryResponse) => {
          expect(response.numberOfResults).toEqual(2);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://0.0.0.0:3333/v2/searchextended/count');

          expect(request?.method).toEqual('POST');

          expect(request?.headers?.['Content-Type']).toEqual('application/sparql-query; charset=utf-8');

          expect(request?.body).toEqual(gravsearchQuery);

          done();
        });
    });

    it('should unsuccessfully attempt perform an extended search count query', done => {
      const gravsearchQuery = `
                PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
                CONSTRUCT {

                    ?mainRes knora-api:isMainResource true .

                } WHERE {

                    ?mainRes a knora-api:Resource .

                    ?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .
                }

                OFFSET 0
            `;

      ajaxMock.setMockError({}, 400);

      knoraApiConnection.v2.search.doExtendedSearchCountQuery(gravsearchQuery).subscribe(
        (response: CountQueryResponse) => {},
        (err: ApiResponseError) => {
          expect(err instanceof ApiResponseError).toBeTruthy();
          expect(err.status).toEqual(400);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://0.0.0.0:3333/v2/searchextended/count');

          expect(request?.method).toEqual('POST');

          expect(request?.headers?.['Content-Type']).toEqual('application/sparql-query; charset=utf-8');

          expect(request?.body).toEqual(gravsearchQuery);

          done();
        }
      );
    });
  });

  describe('Label search', () => {
    it('should handle parameters correctly', () => {
      expect(SearchEndpointV2['encodeLabelParams'](0)).toEqual('?offset=0');

      expect(SearchEndpointV2['encodeLabelParams'](1)).toEqual('?offset=1');

      expect(SearchEndpointV2['encodeLabelParams'](0, { limitToProject: 'http://rdfh.ch/projects/0001' })).toEqual(
        '?offset=0&limitToProject=http%3A%2F%2Frdfh.ch%2Fprojects%2F0001'
      );

      expect(
        SearchEndpointV2['encodeLabelParams'](0, {
          limitToResourceClass: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
        })
      ).toEqual('?offset=0&limitToResourceClass=http%3A%2F%2F0.0.0.0%3A3333%2Fontology%2F0001%2Fanything%2Fv2%23Thing');

      expect(
        SearchEndpointV2['encodeLabelParams'](0, {
          limitToProject: 'http://rdfh.ch/projects/0001',
          limitToResourceClass: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
        })
      ).toEqual(
        '?offset=0&limitToResourceClass=http%3A%2F%2F0.0.0.0%3A3333%2Fontology%2F0001%2Fanything%2Fv2%23Thing&limitToProject=http%3A%2F%2Frdfh.ch%2Fprojects%2F0001'
      );
    });

    it('should do a label search with a simple search term', done => {
      const resource = require('../../../../test/data/api/v2/resources/things.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search.doSearchByLabel('thing', 0).subscribe((response: ReadResourceSequence) => {
        expect(response.resources.length).toEqual(2);

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe('http://0.0.0.0:3333/v2/searchbylabel/thing?offset=0');

        expect(request?.method).toEqual('GET');

        done();
      });
    });

    it('should unsuccessfully attempt to do a label search', done => {
      ajaxMock.setMockError({}, 400);

      knoraApiConnection.v2.search.doSearchByLabel('thing', 0).subscribe(
        (response: ReadResourceSequence) => {},
        (err: ApiResponseError) => {
          expect(err instanceof ApiResponseError).toBeTruthy();
          expect(err.status).toEqual(400);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://0.0.0.0:3333/v2/searchbylabel/thing?offset=0');

          expect(request?.method).toEqual('GET');

          done();
        }
      );
    });

    it('should do a label search with a simple search term using offset 1', done => {
      const resource = require('../../../../test/data/api/v2/resources/things.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search.doSearchByLabel('thing', 1).subscribe((response: ReadResourceSequence) => {
        expect(response.resources.length).toEqual(2);

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe('http://0.0.0.0:3333/v2/searchbylabel/thing?offset=1');

        expect(request?.method).toEqual('GET');

        done();
      });
    });

    it('should do a label search with a simple search term restricting the search to a specific resource class', done => {
      const resource = require('../../../../test/data/api/v2/resources/things.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search
        .doSearchByLabel('thing', 1, { limitToResourceClass: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing' })
        .subscribe((response: ReadResourceSequence) => {
          expect(response.resources.length).toEqual(2);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toEqual(
            'http://0.0.0.0:3333/v2/searchbylabel/thing?offset=1&limitToResourceClass=http%3A%2F%2F0.0.0.0%3A3333%2Fontology%2F0001%2Fanything%2Fv2%23Thing'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should do a label search with a simple search term restricting the search to a specific project', done => {
      const resource = require('../../../../test/data/api/v2/resources/things.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.search
        .doSearchByLabel('thing', 1, { limitToProject: 'http://rdfh.ch/projects/0001' })
        .subscribe((response: ReadResourceSequence) => {
          expect(response.resources.length).toEqual(2);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toEqual(
            'http://0.0.0.0:3333/v2/searchbylabel/thing?offset=1&limitToProject=http%3A%2F%2Frdfh.ch%2Fprojects%2F0001'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });
});
