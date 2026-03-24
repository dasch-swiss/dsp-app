import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { DecimalConverter } from '../../../custom-converters/decimal-converter';
import { IBaseDecimalValue } from '../type-specific-interfaces/base-decimal-value';
import { ReadValue } from './read-value';

/**
 * @category Model V2
 */
@JsonObject('ReadDecimalValue')
export class ReadDecimalValue extends ReadValue implements IBaseDecimalValue {
  @JsonProperty(Constants.DecimalValueAsDecimal, DecimalConverter)
  decimal: number = 0;
}
