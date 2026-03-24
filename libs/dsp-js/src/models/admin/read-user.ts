import { JsonObject, JsonProperty } from 'json2typescript';

import { PermissionsData } from './permissions-data';
import { StoredGroup } from './stored-group';
import { StoredProject } from './stored-project';
import { StoredUser } from './stored-user';

/**
 * Represents a Knora user.
 *
 * @category Model Admin
 */
@JsonObject('ReadUser')
export class ReadUser extends StoredUser {
  /**
   * A collection of groups.
   */
  @JsonProperty('groups', [StoredGroup])
  groups: StoredGroup[] = [];

  /**
   * A user's permissions data.
   */
  @JsonProperty('permissions', PermissionsData)
  permissions: PermissionsData = new PermissionsData();

  /**
   * The given user is part of the given project.
   */
  @JsonProperty('projects', [StoredProject])
  projects: StoredProject[] = [];

  /**
   * The user's session ID.
   */
  @JsonProperty('sessionId', String, true)
  sessionId?: string = undefined;

  /**
   * The user's token.
   */
  @JsonProperty('token', String, true)
  token?: string = undefined;
}
