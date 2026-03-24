import { JsonObject, JsonProperty } from 'json2typescript';

import { StringLiteral } from './string-literal';

/**
 * A request to update information about a list.
 *
 * @category Model Admin
 */
@JsonObject('UpdateListInfoRequest')
export class UpdateListInfoRequest {
  /**
   * The comments attached to the enclosing object.
   */
  @JsonProperty('comments', [StringLiteral])
  comments: StringLiteral[] = [];

  /**
   * The labels attached to the enclosing object.
   */
  @JsonProperty('labels', [StringLiteral])
  labels: StringLiteral[] = [];

  /**
   * Provides a list IRI.
   */
  @JsonProperty('listIri', String)
  listIri: string = '';

  /**
   * The IRI of a project.
   */
  @JsonProperty('projectIri', String, true)
  projectIri?: string = undefined;
}
