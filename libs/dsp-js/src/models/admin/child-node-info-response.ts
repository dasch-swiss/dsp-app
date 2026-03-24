import { JsonObject, JsonProperty } from 'json2typescript';

import { ChildNodeInfo } from './child-node-info';

/**
 * A response containing information about a list child.
 *
 * @category Model Admin
 */
@JsonObject('ChildNodeInfoResponse')
export class ChildNodeInfoResponse {
  /**
   * Provides information about a list child.
   */
  @JsonProperty('nodeinfo', ChildNodeInfo)
  nodeinfo: ChildNodeInfo = new ChildNodeInfo();
}
