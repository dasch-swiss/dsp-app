import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../Constants';
import { IdConverter } from '../custom-converters/id-converter';
import { StringLiteralToStringConverter } from '../custom-converters/string-literal-to-string-converter';
import { StringLiteralToStringLiteralArrayConverter } from '../custom-converters/string-literal-to-string-literal-array-converter';
import { SubPropertyOfConverter } from '../custom-converters/subproperty-of-converter';
import { StringLiteralV2 } from '../string-literal-v2';
import { PropertyDefinition } from './property-definition';

/**
 * @category Model V2
 */
@JsonObject('SystemPropertyDefinition')
export class SystemPropertyDefinition extends PropertyDefinition {
  @JsonProperty('@id', String)
  id: string = '';

  @JsonProperty(Constants.SubPropertyOf, SubPropertyOfConverter, true)
  subPropertyOf: string[] = [];

  @JsonProperty(Constants.Comment, String, true)
  comment?: string = undefined;

  @JsonProperty(Constants.Label, String, true)
  label?: string = undefined;

  @JsonProperty(Constants.SubjectType, IdConverter, true)
  subjectType?: string = undefined;

  @JsonProperty(Constants.ObjectType, IdConverter, true)
  objectType?: string = undefined;
}

/**
 * @category Model V2
 */
@JsonObject('SystemPropertyDefinitionWithAllLanguages')
export class SystemPropertyDefinitionWithAllLanguages extends SystemPropertyDefinition {
  @JsonProperty(Constants.Comment, StringLiteralToStringConverter, true)
  override comment?: string = undefined;

  @JsonProperty(Constants.Comment, StringLiteralToStringLiteralArrayConverter, true)
  comments: StringLiteralV2[] = [];

  @JsonProperty(Constants.Label, StringLiteralToStringConverter, true)
  override label?: string = undefined;

  @JsonProperty(Constants.Label, StringLiteralToStringLiteralArrayConverter, true)
  labels: StringLiteralV2[] = [];
}
