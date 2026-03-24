import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * Creation or update of a permission.
 *
 * @category Intgernal
 */
@JsonObject('CreateUpdatePermission')
export abstract class CreateUpdatePermission {
  /**
   * An IRI representing additional information about the permission.
   */
  @JsonProperty('additionalInformation')
  additionalInformation: string | null = null;

  /**
   * The name of the enclosing object.
   */
  @JsonProperty('name', String)
  name: string = '';

  /**
   * A permission's numeric permission code.
   */
  @JsonProperty('permissionCode')
  permissionCode: number | null = null;
}
