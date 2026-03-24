import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * Represents a Knora user.
 *
 * @category Model Admin
 */
@JsonObject('User')
export class User {
  /**
   * The email address and login name of a user.
   */
  @JsonProperty('email', String)
  email: string = '';

  /**
   * The user's family name.
   */
  @JsonProperty('familyName', String)
  familyName: string = '';

  /**
   * The user's given name.
   */
  @JsonProperty('givenName', String)
  givenName: string = '';

  /**
   * The ISO 639-1 code of the user's preferred language.
   */
  @JsonProperty('lang', String)
  lang: string = '';

  /**
   * An encrypted credential for access
   */
  @JsonProperty('password', String, true)
  password?: string = undefined;

  /**
   * The status of the user / group / project. It is false if the entity has been deactivated (deleted).
   */
  @JsonProperty('status', Boolean)
  status: boolean = false;

  /**
   * Exists and is true if the user is a member of the SystemAdmin group.
   */
  @JsonProperty('systemAdmin', Boolean, true)
  systemAdmin?: boolean = undefined;

  /**
   * The username and login name of a user.
   */
  @JsonProperty('username', String)
  username: string = '';
}
