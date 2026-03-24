import { JsonObject, JsonProperty } from 'json2typescript';

import { ListNode } from './list-node';
import { ListNodeInfo } from './list-node-info';

/**
 * Represents a list.
 *
 * @category Model Admin
 */
@JsonObject('List')
export class List {
  /**
   * The child nodes of this list node.
   */
  @JsonProperty('children', [ListNode])
  children: ListNode[] = [];

  /**
   * Provides information about a list.
   */
  @JsonProperty('listinfo', ListNodeInfo)
  listinfo: ListNodeInfo = new ListNodeInfo();
}
