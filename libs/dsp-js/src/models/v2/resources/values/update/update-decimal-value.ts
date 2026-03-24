import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { DecimalConverter } from '../../../custom-converters/decimal-converter';
import { IBaseDecimalValue } from '../type-specific-interfaces/base-decimal-value';
import { UpdateValue } from './update-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateDecimalValue')
export class UpdateDecimalValue extends UpdateValue implements IBaseDecimalValue {
  @JsonProperty(Constants.DecimalValueAsDecimal, DecimalConverter)
  decimal: number = 0;

  constructor() {
    super(Constants.DecimalValue);
  }
}
