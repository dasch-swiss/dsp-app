import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * A request to update a user.
 *
 * @category Model Admin
 */
@JsonObject('UpdateUserRequest')
export class UpdateUserRequest {
  /**
   * The email address and login name of a user.
   */
  @JsonProperty('email', String, true)
  email?: string = undefined;

  /**
   * The user's family name.
   */
  @JsonProperty('familyName', String, true)
  familyName?: string = undefined;

  /**
   * The user's given name.
   */
  @JsonProperty('givenName', String, true)
  givenName?: string = undefined;

  /**
   * The ISO 639-1 code of the user's preferred language.
   */
  @JsonProperty('lang', String, true)
  lang?: string = undefined;

  /**
   * The username and login name of a user.
   */
  @JsonProperty('username', String, true)
  username?: string = undefined;
}
