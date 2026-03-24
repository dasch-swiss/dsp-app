import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IdConverter } from '../../../custom-converters/id-converter';
import { IBaseTextValueAsString, IBaseTextValueAsXml } from '../type-specific-interfaces/base-text-value';
import { CreateValue } from './create-value';

/**
 * @category Model V2
 */
@JsonObject('CreateTextValueAsString')
export class CreateTextValueAsString extends CreateValue implements IBaseTextValueAsString {
  @JsonProperty(Constants.ValueAsString, String)
  text: string = '';

  constructor() {
    super(Constants.TextValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('CreateTextValueAsXml')
export class CreateTextValueAsXml extends CreateValue implements IBaseTextValueAsXml {
  @JsonProperty(Constants.TextValueAsXml, String)
  xml: string = '';

  @JsonProperty(Constants.TextValueHasMapping, IdConverter)
  mapping: string = '';

  constructor() {
    super(Constants.TextValue);
  }
}
