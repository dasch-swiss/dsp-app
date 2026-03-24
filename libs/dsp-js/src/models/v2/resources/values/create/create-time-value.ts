import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { DateTimeStampConverter } from '../../../custom-converters/date-time-stamp-converter';
import { IBaseTimeValue } from '../type-specific-interfaces/base-time-value';
import { CreateValue } from './create-value';

/**
 * @category Model V2
 */
@JsonObject('CreateTimeValue')
export class CreateTimeValue extends CreateValue implements IBaseTimeValue {
  @JsonProperty(Constants.TimeValueAsTimeStamp, DateTimeStampConverter)
  time: string = '';

  constructor() {
    super(Constants.TimeValue);
  }
}
