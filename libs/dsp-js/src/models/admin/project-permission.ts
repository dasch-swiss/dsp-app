import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * A permission belonging to a project.
 *
 * @category Model Admin
 */
@JsonObject('ProjectPermission')
export class ProjectPermission {
  /**
   * The Iri of the permission.
   */
  @JsonProperty('iri', String)
  id: string = '';

  /**
   * The type of the permission.
   */
  @JsonProperty('permissionType', String)
  permissionType: string = '';
}
