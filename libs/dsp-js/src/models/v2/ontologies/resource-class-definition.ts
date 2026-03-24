import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../Constants';
import { DateTimeStampConverter } from '../custom-converters/date-time-stamp-converter';
import { HasCardinalityForPropertyConverter } from '../custom-converters/has-cardinality-for-property-converter';
import { StringLiteralToStringConverter } from '../custom-converters/string-literal-to-string-converter';
import { StringLiteralToStringLiteralArrayConverter } from '../custom-converters/string-literal-to-string-literal-array-converter';
import { SubClassOfConverter } from '../custom-converters/subclass-of-converter';
import { StringLiteralV2 } from '../string-literal-v2';
import { ClassDefinition, IHasProperty } from './class-definition';

/**
 * @category Model V2
 */
@JsonObject('ResourceClassDefinition')
export class ResourceClassDefinition extends ClassDefinition {
  @JsonProperty('@id', String)
  id: string = '';

  @JsonProperty(Constants.SubClassOf, SubClassOfConverter)
  subClassOf: string[] = [];

  @JsonProperty(Constants.Comment, String, true)
  comment?: string = undefined;

  @JsonProperty(Constants.Label, String, true)
  label?: string = undefined;

  @JsonProperty(Constants.SubClassOf, HasCardinalityForPropertyConverter)
  propertiesList: IHasProperty[] = [];

  @JsonProperty(Constants.CanBeInstantiated, Boolean, true)
  canBeInstantiated: boolean = false;
}

/**
 * @category Model V2
 */
@JsonObject('ResourceClassDefinitionWithAllLanguages')
export class ResourceClassDefinitionWithAllLanguages extends ResourceClassDefinition {
  @JsonProperty(Constants.Comment, StringLiteralToStringConverter, true)
  override comment?: string = undefined;

  @JsonProperty(Constants.Comment, StringLiteralToStringLiteralArrayConverter, true)
  comments: StringLiteralV2[] = [];

  @JsonProperty(Constants.Label, StringLiteralToStringConverter, true)
  override label?: string = undefined;

  @JsonProperty(Constants.Label, StringLiteralToStringLiteralArrayConverter, true)
  labels: StringLiteralV2[] = [];

  @JsonProperty(Constants.LastModificationDate, DateTimeStampConverter, true)
  lastModificationDate?: string = undefined;
}
