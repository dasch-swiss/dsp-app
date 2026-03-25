import { JsonObject, JsonProperty } from 'json2typescript';

import { StringLiteral } from './string-literal';

/**
 * A request to update a child node.
 *
 * @category Model Admin
 */
@JsonObject('UpdateChildNodeRequest')
export class UpdateChildNodeRequest {
  /**
   * Provides a list IRI.
   */
  @JsonProperty('listIri', String)
  listIri = '';

  /**
   * The IRI of a project.
   */
  @JsonProperty('projectIri', String)
  projectIri = '';

  /**
   * The name of the node.
   */
  @JsonProperty('name', String, true)
  name?: string = undefined;

  /**
   * The labels attached to the enclosing object.
   */
  @JsonProperty('labels', [StringLiteral], true)
  labels?: StringLiteral[] = undefined;

  /**
   * The comments attached to the enclosing object.
   */
  @JsonProperty('comments', [StringLiteral], true)
  comments?: StringLiteral[] = undefined;
}
