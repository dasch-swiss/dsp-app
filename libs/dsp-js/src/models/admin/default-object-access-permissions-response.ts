import { JsonObject, JsonProperty } from 'json2typescript';
import { DefaultObjectAccessPermission } from './default-object-access-permission';

/**
 * Represents a project's default object access permissions.
 *
 * @category Model Admin
 */
@JsonObject('DefaultObjectAccessPermissionsResponse')
export class DefaultObjectAccessPermissionsResponse {
  /**
   * The permissions belonging to a project.
   */
  @JsonProperty('default_object_access_permissions', [DefaultObjectAccessPermission])
  defaultObjectAccessPermissions: DefaultObjectAccessPermission[] = [];
}
