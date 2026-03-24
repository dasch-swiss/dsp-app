import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * A project's restricted view settings.
 *
 * @category Model Admin
 */
@JsonObject('ProjectRestrictedViewSettings')
export class ProjectRestrictedViewSettings {
  /**
   * The image size used in restricted image view in a project.
   */
  @JsonProperty('size', String, true)
  size?: string = undefined;

  /**
   * The watermark used in restricted image view in a project.
   */
  @JsonProperty('watermark', Boolean, true)
  watermark?: Boolean = false;
}
