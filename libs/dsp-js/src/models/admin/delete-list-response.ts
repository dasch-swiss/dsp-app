import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * A response containing a deleted flag and iri.
 *
 * @category Model Admin
 */
@JsonObject('DeleteListResponse')
export class DeleteListResponse {
  /**
   * Status of list node.
   */
  @JsonProperty('deleted', Boolean)
  deleted: boolean = false;

  /**
   * The IRI of the deleted list.
   */
  @JsonProperty('iri', String)
  iri: string = '';
}
