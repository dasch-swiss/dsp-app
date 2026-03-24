import { JsonObject, JsonProperty } from 'json2typescript';

import { ListNode } from './list-node';

/**
 * A response containing a list node.
 *
 * @category Internal
 */
@JsonObject('ListNodeResponse')
export abstract class ListNodeResponse {
  /**
   * Provides a list node.
   */
  @JsonProperty('node', ListNode)
  node: ListNode = new ListNode();
}
