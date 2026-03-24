import { JsonObject, JsonProperty } from 'json2typescript';
import { AdminDoapBase } from './admin-doap-base';

/**
 * An administrative permission.
 *
 * @category Model Admin
 */
@JsonObject('AdministrativePermission')
export class AdministrativePermission extends AdminDoapBase {
  /**
   * The group that the permission applies to.
   */
  @JsonProperty('forGroup', String)
  forGroup: string = '';
}
