import { JsonObject, JsonProperty } from 'json2typescript';

import { Permission } from './permission';
import { AdministrativePermissionsPerProjectConverter } from './custom-converters/administrative-permissions-per-project-converter';
import { GroupsPerProjectConverter } from './custom-converters/groups-per-project-converter';

/**
 * A user's permissions data.
 *
 * @category Model Admin
 */
@JsonObject('PermissionsData')
export class PermissionsData {
  /**
   * A user's administrative permissions per project.
   */
  @JsonProperty('administrativePermissionsPerProject', AdministrativePermissionsPerProjectConverter, true)
  administrativePermissionsPerProject?: { [key: string]: Permission[] } = undefined;

  /**
   * A user's groups per project.
   */
  @JsonProperty('groupsPerProject', GroupsPerProjectConverter, true)
  groupsPerProject?: { [key: string]: string[] } = undefined;
}
