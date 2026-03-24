import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * Update of a default object access permission's resource class.
 *
 * @category Model Admin
 */
@JsonObject('UpdateDefaultObjectAccessPermissionResourceClass')
export class UpdateDefaultObjectAccessPermissionResourceClass {
  /**
   * The permissions granted by an AdministrativePermission.
   */
  @JsonProperty('forResourceClass')
  forResourceClass: string | null = null;
}
