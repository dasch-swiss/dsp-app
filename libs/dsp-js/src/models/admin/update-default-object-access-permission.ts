import { JsonObject, JsonProperty } from 'json2typescript';
import { CreatePermission } from './create-permission';
import { UpdatePermission } from './update-permission';

/**
 * Update of a default object access permission.
 *
 * @category Model Admin
 */
@JsonObject('UpdateDefaultObjectAccessPermission')
export class UpdateDefaultObjectAccessPermission {
  /**
   * The permissions granted by an default object access permission.
   */
  @JsonProperty('hasPermissions', [CreatePermission])
  hasPermissions: UpdatePermission[] = [];
}
