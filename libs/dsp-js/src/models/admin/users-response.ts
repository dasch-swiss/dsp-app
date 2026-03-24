import { JsonObject, JsonProperty } from 'json2typescript';

import { ReadUser } from './read-user';

/**
 * A response providing a collection of users.
 *
 * @category Model Admin
 */
@JsonObject('UsersResponse')
export class UsersResponse {
  /**
   * The users returned in a UsersResponse.
   */
  @JsonProperty('users', [ReadUser])
  users: ReadUser[] = [];
}
