import { JsonObject, JsonProperty } from 'json2typescript';

import { ListNodeInfo } from './list-node-info';

/**
 * A response providing a collection of lists.
 *
 * @category Model Admin
 */
@JsonObject('ListsResponse')
export class ListsResponse {
  /**
   * A collection of lists.
   */
  @JsonProperty('lists', [ListNodeInfo])
  lists: ListNodeInfo[] = [];
}
