import { JsonObject, JsonProperty } from 'json2typescript';

import { ListNode } from './list-node';

/**
 * A list node.
 *
 * @category Model Admin
 */
@JsonObject('StoredListNode')
export class StoredListNode extends ListNode {
  /**
   * The ID of the enclosing object.
   */
  @JsonProperty('id', String)
  override id: string = '';
}
