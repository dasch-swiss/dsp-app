import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { DateTimeStampConverter } from '../../../custom-converters/date-time-stamp-converter';
import { IBaseTimeValue } from '../type-specific-interfaces/base-time-value';
import { UpdateValue } from './update-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateTimeValue')
export class UpdateTimeValue extends UpdateValue implements IBaseTimeValue {
  @JsonProperty(Constants.TimeValueAsTimeStamp, DateTimeStampConverter)
  time: string = '';

  constructor() {
    super(Constants.TimeValue);
  }
}
