import { JsonObject, JsonProperty } from 'json2typescript';
import { StringLiteral } from './string-literal';

/**
 * A request to update the labels of a child node.
 *
 * @category Model Admin
 */
@JsonObject('UpdateChildNodeLabelsRequest')
export class UpdateChildNodeLabelsRequest {
  /**
   * The updated child node labels.
   */
  @JsonProperty('labels', [StringLiteral])
  labels: StringLiteral[] = [];
}
