import { JsonObject, JsonProperty } from 'json2typescript';
import { Permission } from './permission';

/**
 * @category Internal
 */
@JsonObject('AdminDoapBase')
export abstract class AdminDoapBase {
  /**
   * The administrative permission's iri.
   */
  @JsonProperty('iri', String)
  id: string = '';

  /**
   * The project that the permission applies to.
   */
  @JsonProperty('forProject', String)
  forProject: string = '';

  /**
   * The permissions granted by an AdministrativePermission.
   */
  @JsonProperty('hasPermissions', [Permission])
  hasPermissions: Permission[] = [];
}
