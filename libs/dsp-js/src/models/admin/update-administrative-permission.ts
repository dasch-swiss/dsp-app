/**
 * Update of an administrative permission.
 *
 * @category Model Admin
 */
import { JsonObject, JsonProperty } from 'json2typescript';
import { CreatePermission } from './create-permission';
import { UpdatePermission } from './update-permission';

@JsonObject('UpdateAdministrativePermission')
export class UpdateAdministrativePermission {
  /**
   * The permissions granted by an AdministrativePermission.
   */
  @JsonProperty('hasPermissions', [CreatePermission])
  hasPermissions: UpdatePermission[] = [];
}
