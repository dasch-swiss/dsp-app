import { JsonObject, JsonProperty } from 'json2typescript';

import { StringLiteral } from './string-literal';

/**
 * Represents a project that uses Knora.
 *
 * @category Model Admin
 */
@JsonObject('Project')
export class Project {
  /**
   * Project keywords.
   */
  @JsonProperty('keywords', [String])
  keywords: string[] = [];

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
  @JsonProperty('description', [StringLiteral])
  description: StringLiteral[] = [];

  /**
   * Exists and is true if users can add themselves to the project or group.
   */
  @JsonProperty('selfjoin', Boolean)
  selfjoin: boolean = false;

  /**
   * The unique short code of a Knora project.
   */
  @JsonProperty('shortcode', String)
  shortcode: string = '';

  /**
   * The unique shortname of a Knora project.
   */
  @JsonProperty('shortname', String)
  shortname: string = '';

  /**
   * The status of the user / group / project. It is false if the entity has been deactivated (deleted).
   */
  @JsonProperty('status', Boolean)
  status: boolean = false;
}
