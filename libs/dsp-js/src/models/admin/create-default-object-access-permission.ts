import { JsonObject, JsonProperty } from 'json2typescript';
import { CreateAdminDoapBase } from './create-admin-doap-base';

/**
 * Creation of a default object access permission permission.
 *
 * @category Model Admin
 */
@JsonObject('CreateDefaultObjectAccessPermission')
export class CreateDefaultObjectAccessPermission extends CreateAdminDoapBase {
  /**
   * The group that the permission applies to.
   */
  @JsonProperty('forGroup')
  forGroup: string | null = null;

  /**
   * The property that the permission applies to.
   */
  @JsonProperty('forProperty')
  forProperty: string | null = null;

  /**
   * The permissions granted by an AdministrativePermission.
   */
  @JsonProperty('forResourceClass')
  forResourceClass: string | null = null;
}
