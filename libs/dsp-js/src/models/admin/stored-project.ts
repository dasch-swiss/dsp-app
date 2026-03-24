import { JsonObject, JsonProperty } from 'json2typescript';

import { Project } from './project';

/**
 * Represents a project that uses Knora.
 *
 * @category Model Admin
 */
@JsonObject('StoredProject')
export class StoredProject extends Project {
  /**
   * The ID of the enclosing object.
   */
  @JsonProperty('id', String)
  id: string = '';
}
