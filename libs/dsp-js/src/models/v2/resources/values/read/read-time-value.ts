import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { DateTimeStampConverter } from '../../../custom-converters/date-time-stamp-converter';
import { IBaseTimeValue } from '../type-specific-interfaces/base-time-value';
import { ReadValue } from './read-value';

/**
 * @category Model V2
 */
@JsonObject('ReadTimeValue')
export class ReadTimeValue extends ReadValue implements IBaseTimeValue {
  @JsonProperty(Constants.TimeValueAsTimeStamp, DateTimeStampConverter)
  time: string = '';
}
