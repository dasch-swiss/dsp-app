import { JsonObject, JsonProperty } from 'json2typescript';
import { StringLiteral } from './string-literal';

/**
 * A request to update the comments of a child node.
 *
 * @category Model Admin
 */
@JsonObject('UpdateChildNodeCommentsRequest')
export class UpdateChildNodeCommentsRequest {
  /**
   * The updated child node comments.
   */
  @JsonProperty('comments', [StringLiteral])
  comments: StringLiteral[] = [];
}
