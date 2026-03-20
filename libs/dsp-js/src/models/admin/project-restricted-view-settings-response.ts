import { JsonObject, JsonProperty } from 'json2typescript';

import { ProjectRestrictedViewSettings } from './project-restricted-view-settings';

/**
 * A response providing a project's restricted view settings.
 *
 * @category Model Admin
 */
@JsonObject('ProjectRestrictedViewSettingsResponse')
export class ProjectRestrictedViewSettingsResponse {
  /**
   * A project's restricted view settings.
   */
  @JsonProperty('settings', ProjectRestrictedViewSettings)
  settings: ProjectRestrictedViewSettings = new ProjectRestrictedViewSettings();
}
