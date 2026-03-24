import { JsonObject, JsonProperty } from 'json2typescript';

import { ReadUser } from './read-user';

/**
 * A response providing a collection of group or project members.
 *
 * @category Model Admin
 */
@JsonObject('MembersResponse')
export class MembersResponse {
  /**
   * The members of a group or project.
   */
  @JsonProperty('members', [ReadUser])
  members: ReadUser[] = [];
}
