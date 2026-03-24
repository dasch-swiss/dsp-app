import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * Update of a default object access permission's property.
 *
 * @category Model Admin
 */
@JsonObject('UpdateDefaultObjectAccessPermissionProperty')
export class UpdateDefaultObjectAccessPermissionProperty {
  /**
   * The property that the permission applies to.
   */
  @JsonProperty('forProperty')
  forProperty: string | null = null;
}
