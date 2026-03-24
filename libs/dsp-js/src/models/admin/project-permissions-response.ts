import { JsonObject, JsonProperty } from 'json2typescript';
import { ProjectPermission } from './project-permission';

/**
 * Represents a project's permissions.
 *
 * @category Model Admin
 */
@JsonObject('ProjectPermissionsResponse')
export class ProjectPermissionsResponse {
  /**
   * The permissions belonging to a project.
   */
  @JsonProperty('permissions', [ProjectPermission])
  permissions: ProjectPermission[] = [];
}
