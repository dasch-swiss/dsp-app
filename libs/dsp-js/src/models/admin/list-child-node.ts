import { JsonObject, JsonProperty } from 'json2typescript';

import { ListNode } from './list-node';
import { ListNodeInfo } from './list-node-info';

/**
 * Represents a list.
 *
 * @category Model Admin
 */
@JsonObject('ListChildNode')
export class ListChildNode {
  /**
   * The child nodes of this list node.
   */
  @JsonProperty('children', [ListNode])
  children: ListNode[] = [];

  /**
   * Provides information about a list.
   */
  @JsonProperty('nodeinfo', ListNodeInfo)
  nodeinfo: ListNodeInfo = new ListNodeInfo();
}
