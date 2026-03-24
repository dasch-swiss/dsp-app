import { JsonObject, JsonProperty } from 'json2typescript';

import { List } from './list';

/**
 * A response containing a list.
 *
 * @category Model Admin
 */
@JsonObject('ListResponse')
export class ListResponse {
  /**
   * Provides a list.
   */
  @JsonProperty('list', List)
  list: List = new List();
}
