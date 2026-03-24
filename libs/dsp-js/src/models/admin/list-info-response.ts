import { JsonObject, JsonProperty } from 'json2typescript';

import { ListNodeInfo } from './list-node-info';

/**
 * A response containing information about a list.
 *
 * @category Model Admin
 */
@JsonObject('ListInfoResponse')
export class ListInfoResponse {
  /**
   * Provides information about a list.
   */
  @JsonProperty('listinfo', ListNodeInfo)
  listinfo: ListNodeInfo = new ListNodeInfo();
}
