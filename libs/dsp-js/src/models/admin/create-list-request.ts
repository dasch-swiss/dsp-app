import { JsonObject, JsonProperty } from 'json2typescript';

import { StringLiteral } from './string-literal';

/**
 * A request to create a list.
 *
 * @category Model Admin
 */
@JsonObject('CreateListRequest')
export class CreateListRequest {
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
   * The name of the enclosing object.
   */
  @JsonProperty('name', String, true)
  name?: string = undefined;

  /**
   * The IRI of a project.
   */
  @JsonProperty('projectIri', String)
  projectIri: string = '';
}
