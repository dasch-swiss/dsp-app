import { JsonObject, JsonProperty } from 'json2typescript';
import { CreatePermission } from './create-permission';

/**
 * @category Internal
 */
@JsonObject('CreateAdminDoapBase')
export abstract class CreateAdminDoapBase {
  /**
   * The permissions id, if provided.
   */
  @JsonProperty('id', String, true)
  id?: string;

  /**
   * The project that the permission applies to.
   */
  @JsonProperty('forProject', String)
  forProject: string = '';

  /**
   * The permissions granted by an AdministrativePermission.
   */
  @JsonProperty('hasPermissions', [CreatePermission])
  hasPermissions: CreatePermission[] = [];
}
