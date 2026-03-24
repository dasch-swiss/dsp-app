import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';
import { IdConverter } from '../../custom-converters/id-converter';
import { UpdateEntityCommentOrLabel } from './update-entity-comment-or-label';

/**
 * @category Model V2
 */
@JsonObject('UpdateResourcePropertyGuiElement')
export class UpdateResourcePropertyGuiElement extends UpdateEntityCommentOrLabel {
  @JsonProperty(Constants.GuiElement, IdConverter, true)
  guiElement?: string = undefined;

  @JsonProperty(Constants.GuiAttribute, [String], true)
  guiAttributes?: string[] = undefined;

  constructor() {
    super(Constants.ObjectProperty);
  }
}
