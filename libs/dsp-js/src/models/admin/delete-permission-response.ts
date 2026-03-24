import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * Response to a delete permission request.
 *
 * @category Model Admin
 */
@JsonObject('DeletePermissionResponse')
export class DeletePermissionResponse {
  /**
   * Iri of the permission that has been deleted.
   */
  @JsonProperty('permissionIri', String)
  permissionIri: string = '';

  /**
   * Status of requested deletion.
   */
  @JsonProperty('deleted', Boolean)
  deleted: boolean = false;
}
