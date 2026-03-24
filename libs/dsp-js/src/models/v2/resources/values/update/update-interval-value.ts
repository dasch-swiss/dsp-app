import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { DecimalConverter } from '../../../custom-converters/decimal-converter';
import { IBaseIntervalValue } from '../type-specific-interfaces/base-interval-value';
import { UpdateValue } from './update-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateIntervalValue')
export class UpdateIntervalValue extends UpdateValue implements IBaseIntervalValue {
  @JsonProperty(Constants.IntervalValueHasStart, DecimalConverter)
  start: number = 0;

  @JsonProperty(Constants.IntervalValueHasEnd, DecimalConverter)
  end: number = 0;

  constructor() {
    super(Constants.IntervalValue);
  }
}
