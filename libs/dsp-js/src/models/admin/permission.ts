import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * A permission.
 *
 * @category Model Admin
 */
@JsonObject('Permission')
export class Permission {
  /**
   * An IRI representing additional information about the permission.
   */
  @JsonProperty('additionalInformation', String, true)
  additionalInformation?: string = undefined;

  /**
   * The name of the enclosing object.
   */
  @JsonProperty('name', String)
  name: string = '';

  /**
   * A permission's numeric permission code.
   */
  @JsonProperty('permissionCode', Number, true)
  permissionCode?: number = undefined;
}
