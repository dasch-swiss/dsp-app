import { JsonObject, JsonProperty } from 'json2typescript';

import { ReadProject } from './read-project';

/**
 * A response providing a single project.
 *
 * @category Model Admin
 */
@JsonObject('ProjectResponse')
export class ProjectResponse {
  /**
   * Indicates which project a group belongs to.
   */
  @JsonProperty('project', ReadProject)
  project: ReadProject = new ReadProject();
}
