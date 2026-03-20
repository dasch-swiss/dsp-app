import { JsonObject, JsonProperty } from 'json2typescript';

import { ListChildNode } from './list-child-node';

/**
 * A response containing a list.
 *
 * @category Model Admin
 */
@JsonObject('ListChildNodeResponse')
export class ListChildNodeResponse {
  /**
   * Provides a list child node.
   */
  @JsonProperty('node', ListChildNode)
  node: ListChildNode = new ListChildNode();
}
