import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';
import { StringLiteralToStringLiteralArrayConverter } from '../../custom-converters/string-literal-to-string-literal-array-converter';
import { SubClassOfConverter } from '../../custom-converters/subclass-of-converter';
import { StringLiteralV2 } from '../../string-literal-v2';

/**
 * @category Model V2
 */
@JsonObject('CreateResourceClass')
export class CreateResourceClass {
  name: string = '';

  @JsonProperty('@type', String, true)
  type: string = Constants.Class;

  @JsonProperty(Constants.Label, StringLiteralToStringLiteralArrayConverter)
  label: StringLiteralV2[] = [];

  @JsonProperty(Constants.Comment, StringLiteralToStringLiteralArrayConverter, true)
  comment?: StringLiteralV2[] = undefined;

  @JsonProperty(Constants.SubClassOf, SubClassOfConverter)
  subClassOf: string[] = [];
}

/**
 * @category Internal
 */
@JsonObject('CreateResourceClassPayload')
export class CreateResourceClassPayload extends CreateResourceClass {
  @JsonProperty('@id', String)
  id: string = '';
}
