import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * A request to reposition a child node.
 *
 * @category Model Admin
 */
@JsonObject('RepositionChildNodeRequest')
export class RepositionChildNodeRequest {
  /**
   * The IRI of the parent node which the child node will be moved to.
   */
  @JsonProperty('parentNodeIri', String)
  parentNodeIri: string = '';

  /**
   * The position the child node should be moved to.
   * -1 represents the end of the list.
   */
  @JsonProperty('position', Number)
  position: number = -1;
}
