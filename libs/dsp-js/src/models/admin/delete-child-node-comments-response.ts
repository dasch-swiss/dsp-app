import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * A response containing a deleted flag and iri.
 *
 * @category Model Admin
 */
@JsonObject('DeleteChildNodeCommentsResponse')
export class DeleteChildNodeCommentsResponse {
  /**
   * Status of list node comment.
   */
  @JsonProperty('commentsDeleted', Boolean)
  commentsDeleted: boolean = false;

  /**
   * The IRI of the deleted list node.
   */
  @JsonProperty('nodeIri', String)
  nodeIri: string = '';
}
