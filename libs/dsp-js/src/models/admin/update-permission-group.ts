import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * Update of a permission's group.
 *
 * @category Model Internal
 */
@JsonObject('UpdatePermissionGroup')
export abstract class UpdatePermissionGroup {
  /**
   * The group that the permission applies to.
   */
  @JsonProperty('forGroup', String)
  forGroup!: string;
}
