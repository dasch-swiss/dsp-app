import { JsonObject, JsonProperty } from 'json2typescript';
import { AdministrativePermission } from './administrative-permission';

/**
 * A response providing all administrative permissions.
 *
 * @category Model Admin
 */
@JsonObject('AdministrativePermissionsResponse')
export class AdministrativePermissionsResponse {
  /**
   * Provides all administrative permissions.
   */
  @JsonProperty('administrative_permissions', [AdministrativePermission])
  administrative_permissions: AdministrativePermission[] = [];
}
