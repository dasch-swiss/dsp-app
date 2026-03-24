import { JsonObject, JsonProperty } from 'json2typescript';

import { ListNodeInfo } from './list-node-info';

/**
 * A response containing information about a list node.
 *
 * @category Model Admin
 */
@JsonObject('ListNodeInfoResponse')
export class ListNodeInfoResponse {
  /**
   * Provides information about a list node.
   */
  @JsonProperty('nodeinfo', ListNodeInfo)
  nodeinfo: ListNodeInfo = new ListNodeInfo();
}
