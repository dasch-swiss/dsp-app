import { JsonObject, JsonProperty } from 'json2typescript';

import { ListNodeInfo } from './list-node-info';

/**
 * Information about a list node.
 *
 * @category Model Admin
 */
@JsonObject('StoredListNodeInfo')
export class StoredListNodeInfo extends ListNodeInfo {
  /**
   * The ID of the enclosing object.
   */
  @JsonProperty('id', String)
  override id: string = '';
}
