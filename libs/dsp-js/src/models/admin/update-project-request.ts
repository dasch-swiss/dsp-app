import { JsonObject, JsonProperty } from 'json2typescript';

import { StringLiteral } from './string-literal';

/**
 * A request to update a project.
 *
 * @category Model Admin
 */
@JsonObject('UpdateProjectRequest')
export class UpdateProjectRequest {
  /**
   * Project keywords.
   */
  @JsonProperty('keywords', [String], true)
  keywords?: string[] = undefined;

  /**
   * The path to the projects's logo.
   */
  @JsonProperty('logo', String, true)
  logo?: string = undefined;

  /**
   * The longname of a Knora project.
   */
  @JsonProperty('longname', String, true)
  longname?: string = undefined;

  /**
   * A description of a project.
   */
  @JsonProperty('description', [StringLiteral], true)
  description?: StringLiteral[] = undefined;

  /**
   * Exists and is true if users can add themselves to the project or group.
   */
  @JsonProperty('selfjoin', Boolean, true)
  selfjoin?: boolean = undefined;

  /**
   * The unique shortname of a Knora project.
   */
  @JsonProperty('shortname', String, true)
  shortname?: string = undefined;

  /**
   * The status of the user / group / project. It is false if the entity has been deactivated (deleted).
   */
  @JsonProperty('status', Boolean, true)
  status?: boolean = undefined;
}
