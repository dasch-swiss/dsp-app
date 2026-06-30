import jsonld from 'jsonld/dist/jsonld.js';
import { catchError, map, mergeMap } from 'rxjs';
import { ListNodeV2, ListNodeV2WithAllLanguages } from '../../../models/v2/lists/list-node-v2';
import { Endpoint } from '../../endpoint';

/**
 * Handles requests to the lists route of the Knora API.
 *
 * @category Endpoint V2
 */
export class ListsEndpointV2 extends Endpoint {
  /**
   * Get a specific list node.
   *
   * @param nodeIri the IRI of the list node to be fetched.
   */
  getNode(nodeIri: string) {
    return this.httpGet(`/node/${encodeURIComponent(nodeIri)}`).pipe(
      mergeMap(ajaxResponse => jsonld.compact(ajaxResponse.response, {}) as Promise<object>),
      map(res => this.jsonConvert.deserialize(res as object, ListNodeV2) as ListNodeV2),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Get a specific list node with labels and comments in all languages.
   *
   * @param nodeIri the IRI of the list node to be fetched.
   */
  getNodeWithAllLanguages(nodeIri: string) {
    return this.httpGet(`/node/${encodeURIComponent(nodeIri)}?allLanguages=true`).pipe(
      mergeMap(ajaxResponse => jsonld.compact(ajaxResponse.response, {}) as Promise<object>),
      map(res => this.jsonConvert.deserialize(res as object, ListNodeV2WithAllLanguages) as ListNodeV2WithAllLanguages),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Get an entire list.
   *
   * @param rootNodeIri the list's root node IRI.
   */
  getList(rootNodeIri: string) {
    return this.httpGet(`/lists/${encodeURIComponent(rootNodeIri)}`).pipe(
      mergeMap(ajaxResponse => jsonld.compact(ajaxResponse.response, {}) as Promise<object>),
      map(res => this.jsonConvert.deserialize(res as object, ListNodeV2) as ListNodeV2),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Get an entire list with labels and comments in all languages.
   *
   * @param rootNodeIri the list's root node IRI.
   */
  getListWithAllLanguages(rootNodeIri: string) {
    return this.httpGet(`/lists/${encodeURIComponent(rootNodeIri)}?allLanguages=true`).pipe(
      mergeMap(ajaxResponse => jsonld.compact(ajaxResponse.response, {}) as Promise<object>),
      map(res => this.jsonConvert.deserialize(res as object, ListNodeV2WithAllLanguages) as ListNodeV2WithAllLanguages),
      catchError(error => this.handleError(error))
    );
  }
}
