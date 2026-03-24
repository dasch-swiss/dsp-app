import { catchError, map } from 'rxjs';
import { ChildNodeInfoResponse } from '../../../models/admin/child-node-info-response';
import { CreateChildNodeRequest } from '../../../models/admin/create-child-node-request';
import { CreateListRequest } from '../../../models/admin/create-list-request';
import { DeleteChildNodeCommentsResponse } from '../../../models/admin/delete-child-node-comments-response';
import { DeleteListNodeResponse } from '../../../models/admin/delete-list-node-response';
import { DeleteListResponse } from '../../../models/admin/delete-list-response';
import { ListChildNodeResponse } from '../../../models/admin/list-child-node-response';
import { ListInfoResponse } from '../../../models/admin/list-info-response';
import { ListNodeInfoResponse } from '../../../models/admin/list-node-info-response';
import { ListResponse } from '../../../models/admin/list-response';
import { ListsResponse } from '../../../models/admin/lists-response';
import { RepositionChildNodeRequest } from '../../../models/admin/reposition-child-node-request';
import { RepositionChildNodeResponse } from '../../../models/admin/reposition-child-node-response';
import { UpdateChildNodeCommentsRequest } from '../../../models/admin/update-child-node-comments-request';
import { UpdateChildNodeLabelsRequest } from '../../../models/admin/update-child-node-labels-request';
import { UpdateChildNodeNameRequest } from '../../../models/admin/update-child-node-name-request';
import { UpdateChildNodeRequest } from '../../../models/admin/update-child-node-request';
import { UpdateListInfoRequest } from '../../../models/admin/update-list-info-request';
import { ApiResponseData } from '../../../models/api-response-data';
import { Endpoint } from '../../endpoint';

/**
 * An endpoint for working with Knora lists.
 * @deprecated Use open API docs instead
 * @category Endpoint Admin
 */
export class ListsEndpointAdmin extends Endpoint {
  /**
   * Returns a list of lists.
   */
  getLists() {
    return this.httpGet('').pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ListsResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Returns a list of lists in a project.
   *
   * @param projectIri The IRI of the project.
   */
  getListsInProject(projectIri: string) {
    return this.httpGet('?projectIri=' + encodeURIComponent(projectIri)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ListsResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates information about a list.
   *
   * @param listInfo Information about the list to be created.
   */
  updateListInfo(listInfo: UpdateListInfoRequest) {
    return this.httpPut('/' + encodeURIComponent(listInfo.listIri), this.jsonConvert.serializeObject(listInfo)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ListInfoResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates the name of an existing child node.
   *
   * @param listItemIri the Iri of the list item.
   * @param name the new name to replace the existing name.
   */
  updateChildName(listItemIri: string, name: UpdateChildNodeNameRequest) {
    return this.httpPut('/' + encodeURIComponent(listItemIri) + '/name', this.jsonConvert.serializeObject(name)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ChildNodeInfoResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates the labels of an existing child node.
   *
   * @param listItemIri the Iri of the list item.
   * @param labels the new labels to replace the existing labels.
   */
  updateChildLabels(listItemIri: string, labels: UpdateChildNodeLabelsRequest) {
    return this.httpPut(
      '/' + encodeURIComponent(listItemIri) + '/labels',
      this.jsonConvert.serializeObject(labels)
    ).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ChildNodeInfoResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates the comments of an existing child node.
   *
   * @param listItemIri the Iri of the list item.
   * @param comments the new comments to replace the existing comments.
   */
  updateChildComments(listItemIri: string, comments: UpdateChildNodeCommentsRequest) {
    return this.httpPut(
      '/' + encodeURIComponent(listItemIri) + '/comments',
      this.jsonConvert.serializeObject(comments)
    ).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ChildNodeInfoResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Deletes the comments of an existing child node.
   *
   * @param listItemIri the Iri of the list item.
   */
  deleteChildComments(listItemIri: string) {
    return this.httpDelete('/comments/' + encodeURIComponent(listItemIri)).pipe(
      map(ajaxResponse =>
        ApiResponseData.fromAjaxResponse(ajaxResponse, DeleteChildNodeCommentsResponse, this.jsonConvert)
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Creates a child node in a list.
   *
   * @param node The node to be created.
   */
  createChildNode(node: CreateChildNodeRequest) {
    return this.httpPost('/' + encodeURIComponent(node.parentNodeIri), this.jsonConvert.serializeObject(node)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ListNodeInfoResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Returns information about a list.
   *
   * @param iri The IRI of the list.
   */
  getListInfo(iri: string) {
    return this.httpGet('/infos/' + encodeURIComponent(iri)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ListInfoResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Returns the parent node if an IRI of a child node is given.
   * Returns a deleted flag and IRI if an IRI of a root node is given.
   *
   * @param iri The IRI of the list.
   */
  deleteListNode(iri: string) {
    return this.httpDelete('/' + encodeURIComponent(iri)).pipe(
      map(ajaxResponse => {
        if (ajaxResponse.response.hasOwnProperty('node')) {
          // child node
          return ApiResponseData.fromAjaxResponse(ajaxResponse, DeleteListNodeResponse, this.jsonConvert);
        } else {
          // root node
          return ApiResponseData.fromAjaxResponse(ajaxResponse, DeleteListResponse, this.jsonConvert);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Move child node to a certain position in a list.
   * Parent node IRI can be the same but only if the position is different.
   *
   * @param iri The IRI of the list node to move.
   * @param repositionRequest The parent node IRI and the position the child node should move to.
   */
  repositionChildNode(iri: string, repositionRequest: RepositionChildNodeRequest) {
    return this.httpPut(
      '/' + encodeURIComponent(iri) + '/position',
      this.jsonConvert.serializeObject(repositionRequest)
    ).pipe(
      map(ajaxResponse =>
        ApiResponseData.fromAjaxResponse(ajaxResponse, RepositionChildNodeResponse, this.jsonConvert)
      ),
      catchError(error => this.handleError(error))
    );
  }

  // *** All methods below this point require the "new-list-admin-routes:1=on" feature toggle ***

  /**
   * Updates a child node.
   *
   * @param nodeInfo Information about the node to be updated.
   */
  updateChildNode(nodeInfo: UpdateChildNodeRequest) {
    if (nodeInfo.name === undefined && nodeInfo.labels === undefined && nodeInfo.comments === undefined) {
      throw new Error('At least one property is expected from the following properties: name, labels, comments.');
    }

    return this.httpPut('/' + encodeURIComponent(nodeInfo.listIri), this.jsonConvert.serializeObject(nodeInfo)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ChildNodeInfoResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Returns information about a list node using the new route.
   *
   * @param listItemIri The IRI of the node.
   */
  getListNodeInfo(listItemIri: string) {
    return this.httpGet('/' + encodeURIComponent(listItemIri) + '/info').pipe(
      map(ajaxResponse => {
        if (ajaxResponse.response.hasOwnProperty('listinfo')) {
          // root node
          return ApiResponseData.fromAjaxResponse(ajaxResponse, ListInfoResponse, this.jsonConvert);
        } else {
          // child node
          return ApiResponseData.fromAjaxResponse(ajaxResponse, ListNodeInfoResponse, this.jsonConvert);
        }
      })
    );
  }

  /**
   * Creates a list using the old route but with the feature toggle enabled.
   *
   * @param listInfo Information about the list to be created.
   */
  createList(listInfo: CreateListRequest) {
    return this.httpPost('', this.jsonConvert.serializeObject(listInfo)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ListResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets a list using the old route but with the feature toggle enabled
   *
   * @param listItemIri The IRI of the list.
   */
  getList(listItemIri: string) {
    return this.httpGet('/' + encodeURIComponent(listItemIri)).pipe(
      map(ajaxResponse => {
        if (ajaxResponse.response.hasOwnProperty('list')) {
          return ApiResponseData.fromAjaxResponse(ajaxResponse, ListResponse, this.jsonConvert);
        } else {
          return ApiResponseData.fromAjaxResponse(ajaxResponse, ListChildNodeResponse, this.jsonConvert);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }
}
