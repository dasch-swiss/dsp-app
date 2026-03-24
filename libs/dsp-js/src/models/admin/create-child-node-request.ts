import { JsonObject, JsonProperty } from 'json2typescript';

import { StringLiteral } from './string-literal';

/**
 * A request to create a child node in a list.
 *
 * @category Model Admin
 */
@JsonObject('CreateChildNodeRequest')
export class CreateChildNodeRequest {
  /**
   * The comments attached to the enclosing object.
   */
  @JsonProperty('comments', [StringLiteral], true)
  comments?: StringLiteral[] = undefined;

  /**
   * The labels attached to the enclosing object.
   */
  @JsonProperty('labels', [StringLiteral])
  labels: StringLiteral[] = [];

  /**
   * The name of the enclosing object.
   */
  @JsonProperty('name', String, true)
  name?: string = undefined;

  /**
   * Provides a the IRI of a parent list node.
   */
  @JsonProperty('parentNodeIri', String)
  parentNodeIri: string = '';

  /**
   * The IRI of a project.
   */
  @JsonProperty('projectIri', String)
  projectIri: string = '';

  /**
   * The position of the node.
   */
  @JsonProperty('position', Number, true)
  position?: number = undefined;
}
