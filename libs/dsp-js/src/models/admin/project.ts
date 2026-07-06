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
  selfjoin = false;

  /**
   * The unique short code of a Knora project.
   */
  @JsonProperty('shortcode', String)
  shortcode = '';

  /**
   * The unique shortname of a Knora project.
   */
  @JsonProperty('shortname', String)
  shortname = '';

  /**
   * The status of the user / group / project. It is false if the entity has been deactivated (deleted).
   */
  @JsonProperty('status', Boolean)
  status = false;

  /**
   * The data-side (resource record) license IRI of the project, if configured. Creative Commons only.
   */
  @JsonProperty('dataLicense', String, true)
  dataLicense?: string = undefined;

  /**
   * The data-side copyright holder of the project, if configured.
   */
  @JsonProperty('dataCopyrightHolder', String, true)
  dataCopyrightHolder?: string = undefined;

  /**
   * The data-side default authorship of the project (applied to resource records).
   */
  @JsonProperty('defaultDataAuthorship', [String], true)
  defaultDataAuthorship?: string[] = undefined;
}
