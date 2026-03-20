import { AjaxResponse } from 'rxjs/ajax';
import { catchError, map, mergeMap } from 'rxjs';
import { ListNodeV2Cache } from '../../../cache/ListNodeV2Cache';
import { OntologyCache } from '../../../cache/ontology-cache/OntologyCache';
import { IFulltextSearchParams } from '../../../interfaces/models/v2/i-fulltext-search-params';
import { ILabelSearchParams } from '../../../interfaces/models/v2/i-label-search-params';
import { KnoraApiConfig } from '../../../knora-api-config';
import { ResourcesConversionUtil } from '../../../models/v2/resources/ResourcesConversionUtil';
import { Endpoint } from '../../endpoint';
import { V2Endpoint } from '../v2-endpoint';

declare let require: any; // http://stackoverflow.com/questions/34730010/angular2-5-minute-install-bug-require-is-not-defined
const jsonld = require('jsonld/dist/jsonld.js');

/**
 * Handles requests to the search route of the Knora API.
 *
 * @category Endpoint V2
 */
export class SearchEndpointV2 extends Endpoint {
  constructor(
    protected override readonly knoraApiConfig: KnoraApiConfig,
    protected override readonly path: string,
    private readonly v2Endpoint: V2Endpoint
  ) {
    super(knoraApiConfig, path);
  }

  /**
   * URL encodes fulltext search params.
   *
   * @param offset offset to be used for paging, zero-based.
   * @param params parameters for fulltext search.
   */
  private static encodeFulltextParams(offset: number, params?: IFulltextSearchParams): string {
    let paramsString = `?offset=${offset}`;

    if (params !== undefined) {
      if (params.limitToResourceClass !== undefined) {
        paramsString += '&limitToResourceClass=' + encodeURIComponent(params.limitToResourceClass);
      }

      if (params.limitToProject !== undefined) {
        paramsString += '&limitToProject=' + encodeURIComponent(params.limitToProject);
      }

      if (params.limitToStandoffClass !== undefined) {
        paramsString += '&limitToStandoffClass=' + encodeURIComponent(params.limitToStandoffClass);
      }
    }

    return paramsString;
  }

  /**
   * URL encodes search by label params.
   *
   * @param offset offset to be used for paging, zero-based.
   * @param params parameters for search by label.
   */
  private static encodeLabelParams(offset: number, params?: ILabelSearchParams): string {
    let paramsString = `?offset=${offset}`;

    if (params !== undefined) {
      if (params.limitToResourceClass !== undefined) {
        paramsString += '&limitToResourceClass=' + encodeURIComponent(params.limitToResourceClass);
      }

      if (params.limitToProject !== undefined) {
        paramsString += '&limitToProject=' + encodeURIComponent(params.limitToProject);
      }
    }

    return paramsString;
  }

  /**
   * Performs a fulltext search.
   *
   * @param searchTerm the term to search for.
   * @param offset offset to be used for paging, zero-based.
   * @param params parameters for fulltext search, if any.
   */
  doFulltextSearch(searchTerm: string, offset = 0, params?: IFulltextSearchParams) {
    // TODO: Do not hard-code the URL and http call params, generate this from Knora

    // Create temporary caches for this request only
    // These will be garbage collected after the request completes
    const tempOntologyCache = new OntologyCache(this.knoraApiConfig, this.v2Endpoint);
    const tempListNodeCache = new ListNodeV2Cache(this.v2Endpoint);

    return this.httpGet(
      '/search/' + encodeURIComponent(searchTerm) + SearchEndpointV2.encodeFulltextParams(offset, params)
    ).pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        // TODO: @rosenth Adapt context object
        // TODO: adapt getOntologyIriFromEntityIri
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      mergeMap((jsonldobj: object) => {
        // console.log(JSON.stringify(jsonldobj));
        return ResourcesConversionUtil.createReadResourceSequence(
          jsonldobj,
          tempOntologyCache,
          tempListNodeCache,
          this.jsonConvert
        );
      }),
      catchError(error => {
        return this.handleError(error);
      })
    );
  }

  /**
   * Performs a fulltext search count query.
   *
   * @param searchTerm the term to search for.
   * @param offset offset to be used for paging, zero-based.
   * @param params parameters for fulltext search, if any.
   */
  doFulltextSearchCountQuery(searchTerm: string, offset = 0, params?: IFulltextSearchParams) {
    // TODO: Do not hard-code the URL and http call params, generate this from Knora

    return this.httpGet(
      '/search/count/' + encodeURIComponent(searchTerm) + SearchEndpointV2.encodeFulltextParams(offset, params)
    ).pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        // TODO: @rosenth Adapt context object
        // TODO: adapt getOntologyIriFromEntityIri
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      map((jsonldobj: object) => {
        // console.log(JSON.stringify(jsonldobj));
        return ResourcesConversionUtil.createCountQueryResponse(jsonldobj, this.jsonConvert);
      }),
      catchError(error => {
        return this.handleError(error);
      })
    );
  }

  /**
   * Performs a Gravsearch query.
   *
   * @param gravsearchQuery the given Gravsearch query.
   */
  doExtendedSearch(gravsearchQuery: string) {
    // TODO: Do not hard-code the URL and http call params, generate this from Knora
    // TODO: check if content-type have to be set to text/plain

    // Create temporary caches for this request only
    // These will be garbage collected after the request completes
    const tempOntologyCache = new OntologyCache(this.knoraApiConfig, this.v2Endpoint);
    const tempListNodeCache = new ListNodeV2Cache(this.v2Endpoint);

    return this.httpPost('/searchextended', gravsearchQuery, 'sparql').pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        // TODO: @rosenth Adapt context object
        // TODO: adapt getOntologyIriFromEntityIri
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      mergeMap((jsonldobj: object) => {
        // console.log(JSON.stringify(jsonldobj));
        return ResourcesConversionUtil.createReadResourceSequence(
          jsonldobj,
          tempOntologyCache,
          tempListNodeCache,
          this.jsonConvert
        );
      }),
      catchError(error => {
        return this.handleError(error);
      })
    );
  }

  /**
   * Performs a Gravsearch count query.
   *
   * @param gravsearchQuery the given Gravsearch query.
   */
  doExtendedSearchCountQuery(gravsearchQuery: string) {
    // TODO: Do not hard-code the URL and http call params, generate this from Knora

    return this.httpPost('/searchextended/count', gravsearchQuery, 'sparql').pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        // TODO: @rosenth Adapt context object
        // TODO: adapt getOntologyIriFromEntityIri
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      map((jsonldobj: object) => {
        // console.log(JSON.stringify(jsonldobj));
        return ResourcesConversionUtil.createCountQueryResponse(jsonldobj, this.jsonConvert);
      }),
      catchError(error => {
        return this.handleError(error);
      })
    );
  }

  /**
   * Performs a Gravsearch in order to get incoming links of queried resource
   *
   * @param resourceIri resource that is queried for incoming links
   * @param offset the offset to be used for paging
   */
  doSearchIncomingLinks(resourceIri: string, offset = 0) {
    // Create temporary caches for this request only
    // These will be garbage collected after the request completes
    const tempOntologyCache = new OntologyCache(this.knoraApiConfig, this.v2Endpoint);
    const tempListNodeCache = new ListNodeV2Cache(this.v2Endpoint);

    return this.httpGet(`/searchIncomingLinks/${encodeURIComponent(resourceIri)}?offset=${offset}`).pipe(
      mergeMap(response => {
        return jsonld.compact(response.response, {}) as Promise<object>;
      }),
      mergeMap((jsonld: object) => {
        return ResourcesConversionUtil.createReadResourceSequence(
          jsonld,
          tempOntologyCache,
          tempListNodeCache,
          this.jsonConvert
        );
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  /**
   * Performs a Gravsearch in order to get StillImageRepresentations of queried resource
   *
   * @param resourceIri resource that is queried for incoming links
   * @param offset the offset to be used for paging
   */
  doSearchStillImageRepresentations(resourceIri: string, offset = 0) {
    // Create temporary caches for this request only
    // These will be garbage collected after the request completes
    const tempOntologyCache = new OntologyCache(this.knoraApiConfig, this.v2Endpoint);
    const tempListNodeCache = new ListNodeV2Cache(this.v2Endpoint);

    return this.httpGet(`/searchStillImageRepresentations/${encodeURIComponent(resourceIri)}?offset=${offset}`).pipe(
      mergeMap(response => {
        return jsonld.compact(response.response, {}) as Promise<object>;
      }),
      mergeMap((jsonld: object) => {
        return ResourcesConversionUtil.createReadResourceSequence(
          jsonld,
          tempOntologyCache,
          tempListNodeCache,
          this.jsonConvert
        );
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  /**
   * Performs a Gravsearch in order to get StillImageRepresentations count of queried resource
   *
   * @param resourceIri resource that is queried for incoming links
   */
  doSearchStillImageRepresentationsCount(resourceIri: string) {
    return this.httpGet(`/searchStillImageRepresentationsCount/${encodeURIComponent(resourceIri)}`).pipe(
      mergeMap(response => {
        return jsonld.compact(response.response, {}) as Promise<object>;
      }),
      map((jsonld: object) => {
        return ResourcesConversionUtil.createCountQueryResponse(jsonld, this.jsonConvert);
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  /**
   * Performs a Gravsearch to get incoming regions of queried resource
   *
   * @param resourceIri resource that is queried for incoming links
   * @param offset the offset to be used for paging
   */
  doSearchIncomingRegions(resourceIri: string, offset = 0) {
    // Create temporary caches for this request only
    // These will be garbage collected after the request completes
    const tempOntologyCache = new OntologyCache(this.knoraApiConfig, this.v2Endpoint);
    const tempListNodeCache = new ListNodeV2Cache(this.v2Endpoint);

    return this.httpGet(`/searchIncomingRegions/${encodeURIComponent(resourceIri)}?offset=${offset}`).pipe(
      mergeMap(response => {
        return jsonld.compact(response.response, {}) as Promise<object>;
      }),
      mergeMap((jsonld: object) => {
        return ResourcesConversionUtil.createReadResourceSequence(
          jsonld,
          tempOntologyCache,
          tempListNodeCache,
          this.jsonConvert
        );
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  /**
   * Performs a search by label.
   *
   * @param searchTerm the label to search for.
   * @param offset offset to be used for paging, zero-based.
   * @param params parameters for fulltext search, if any.
   */
  doSearchByLabel(searchTerm: string, offset = 0, params?: ILabelSearchParams) {
    // TODO: Do not hard-code the URL and http call params, generate this from Knora

    // Create temporary caches for this request only
    // These will be garbage collected after the request completes
    const tempOntologyCache = new OntologyCache(this.knoraApiConfig, this.v2Endpoint);
    const tempListNodeCache = new ListNodeV2Cache(this.v2Endpoint);

    return this.httpGet(
      '/searchbylabel/' + encodeURIComponent(searchTerm) + SearchEndpointV2.encodeLabelParams(offset, params)
    ).pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        // TODO: @rosenth Adapt context object
        // TODO: adapt getOntologyIriFromEntityIri
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      mergeMap((jsonldobj: object) => {
        // console.log(JSON.stringify(jsonldobj));
        return ResourcesConversionUtil.createReadResourceSequence(
          jsonldobj,
          tempOntologyCache,
          tempListNodeCache,
          this.jsonConvert
        );
      }),
      catchError(error => {
        return this.handleError(error);
      })
    );
  }

  /**
   * Performs a query to get the count of results when performing a search by label.
   *
   * @param searchTerm the label to search for.
   * @param params parameters for fulltext search, if any.
   */
  doSearchByLabelCountQuery(searchTerm: string, params?: ILabelSearchParams) {
    return this.httpGet(
      '/searchbylabel/count/' + encodeURIComponent(searchTerm) + SearchEndpointV2.encodeLabelParams(0, params)
    ).pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      map((jsonldobj: object) => {
        // console.log(JSON.stringify(jsonldobj));
        return ResourcesConversionUtil.createCountQueryResponse(jsonldobj, this.jsonConvert);
      }),
      catchError(error => {
        return this.handleError(error);
      })
    );
  }
}
