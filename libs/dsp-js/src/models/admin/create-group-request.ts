import { JsonObject, JsonProperty } from 'json2typescript';
import { StringLiteral } from './string-literal';

/**
 * A request to create a group.
 *
 * @category Model Admin
 */
@JsonObject('CreateGroupRequest')
export class CreateGroupRequest {
  /**
   * Descriptions of a user group
   */
  @JsonProperty('descriptions', [StringLiteral], true)
  descriptions?: StringLiteral[] = undefined;

  /**
   * The name of the enclosing object.
   */
  @JsonProperty('name', String)
  name: string = '';

  /**
   * The IRI of a project.
   */
  @JsonProperty('project', String)
  project: string = '';

  /**
   * Exists and is true if users can add themselves to the project or group.
   */
  @JsonProperty('selfjoin', Boolean)
  selfjoin: boolean = false;

  /**
   * The status of the user / group / project. It is false if the entity has been deactivated (deleted).
   */
  @JsonProperty('status', Boolean)
  status: boolean = false;
}
