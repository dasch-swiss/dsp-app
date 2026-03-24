import { JsonObject, JsonProperty } from 'json2typescript';

import { StringLiteral } from './string-literal';

/**
 * Information about a list node.
 *
 * @category Model Admin
 */
@JsonObject('ListNodeInfo')
export class ListNodeInfo {
  /**
   * The comments attached to the enclosing object.
   */
  @JsonProperty('comments', [StringLiteral])
  comments: StringLiteral[] = [];

  /**
   * The IRI of the root node of the list that this node belongs to.
   */
  @JsonProperty('hasRootNode', String, true)
  hasRootNode?: string = undefined;

  /**
   * The ID of the enclosing object.
   */
  @JsonProperty('id', String)
  id: string = '';

  /**
   * True if this is the root node of a list.
   */
  @JsonProperty('isRootNode', Boolean, true)
  isRootNode?: boolean = undefined;

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
   * The position of a list node.
   */
  @JsonProperty('position', Number, true)
  position?: number = undefined;

  /**
   * The IRI of a project.
   */
  @JsonProperty('projectIri', String, true)
  projectIri?: string = undefined;
}
