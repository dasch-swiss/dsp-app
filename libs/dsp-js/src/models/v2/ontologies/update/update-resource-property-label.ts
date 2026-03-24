import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';
import { StringLiteralToStringLiteralArrayConverter } from '../../custom-converters/string-literal-to-string-literal-array-converter';
import { StringLiteralV2 } from '../../string-literal-v2';
import { UpdateEntityCommentOrLabel } from './update-entity-comment-or-label';

/**
 * @category Model V2
 */
@JsonObject('UpdateResourcePropertyLabel')
export class UpdateResourcePropertyLabel extends UpdateEntityCommentOrLabel {
  @JsonProperty(Constants.Label, StringLiteralToStringLiteralArrayConverter)
  labels: StringLiteralV2[] = [];

  constructor() {
    super(Constants.ObjectProperty);
  }
}
