import { JsonObject, JsonProperty } from 'json2typescript';
import { AdminDoapBase } from './admin-doap-base';

/**
 * @category Model Admin
 */
@JsonObject('DefaultObjectAccessPermission')
export class DefaultObjectAccessPermission extends AdminDoapBase {
  /**
   * The group that the permission applies to.
   */
  @JsonProperty('forGroup', String, true)
  forGroup?: string = undefined;

  /**
   * The property that the permission applies to.
   */
  @JsonProperty('forProperty', String, true)
  forProperty?: string = undefined;

  /**
   * The resource class that the permission applies to.
   */
  @JsonProperty('forResourceClass', String, true)
  forResourceClass?: string = undefined;
}
