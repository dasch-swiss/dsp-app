import { JsonObject, JsonProperty } from 'json2typescript';
import { CreateAdminDoapBase } from './create-admin-doap-base';

/**
 * Creation of an administrative permission.
 *
 * @category Model Admin
 */
@JsonObject('CreateAdministrativePermission')
export class CreateAdministrativePermission extends CreateAdminDoapBase {
  /**
   * The group that the permission applies to.
   */
  @JsonProperty('forGroup', String)
  forGroup!: string;
}
