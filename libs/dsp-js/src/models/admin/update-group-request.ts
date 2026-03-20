import { JsonObject, JsonProperty } from 'json2typescript';
import { StringLiteral } from './string-literal';

/**
 * A request to update a group.
 *
 * @category Model Admin
 */
@JsonObject('UpdateGroupRequest')
export class UpdateGroupRequest {
  /**
   * Descriptions of a user group
   */
  @JsonProperty('descriptions', [StringLiteral], true)
  descriptions?: StringLiteral[] = undefined;

  /**
   * The name of the enclosing object.
   */
  @JsonProperty('name', String, true)
  name?: string = undefined;

  /**
   * Exists and is true if users can add themselves to the project or group.
   */
  @JsonProperty('selfjoin', Boolean, true)
  selfjoin?: boolean = undefined;

  /**
   * The status of the user / group / project. It is false if the entity has been deactivated (deleted).
   */
  @JsonProperty('status', Boolean, true)
  status?: boolean = undefined;
}
