import { JsonObject, JsonProperty } from 'json2typescript';

import { StoredProject } from './stored-project';

/**
 * Represents a project that uses Knora.
 *
 * @category Model Admin
 */
@JsonObject('ReadProject')
export class ReadProject extends StoredProject {
  /**
   * The ontologies attached to a project.
   */
  @JsonProperty('ontologies', [String])
  ontologies: string[] = [];
}
