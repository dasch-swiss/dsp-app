import { JsonObject, JsonProperty } from 'json2typescript';

import { AdministrativePermission } from './administrative-permission';

/**
 * An administrative permission.
 *
 * @category Model Admin
 */
@JsonObject('StoredAdministrativePermission')
export class StoredAdministrativePermission extends AdministrativePermission {
  /**
   * The IRI of the enclosing object.
   */
  @JsonProperty('iri', String)
  iri: string = '';
}
