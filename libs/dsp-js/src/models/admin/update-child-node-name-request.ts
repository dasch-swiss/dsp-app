import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * A request to update the name of a child node.
 *
 * @category Model Admin
 */
@JsonObject('UpdateChildNodeNameRequest')
export class UpdateChildNodeNameRequest {
  /**
   * The updated child node name.
   */
  @JsonProperty('name', String)
  name: string = '';
}
