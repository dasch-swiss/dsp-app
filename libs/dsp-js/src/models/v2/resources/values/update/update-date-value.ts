import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseDateValue } from '../type-specific-interfaces/base-date-value';
import { UpdateValue } from './update-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateDateValue')
export class UpdateDateValue extends UpdateValue implements IBaseDateValue {
  @JsonProperty(Constants.DateValueHasCalendar, String)
  calendar: string = '';

  @JsonProperty(Constants.DateValueHasStartDay, Number, true)
  startDay?: number = undefined;

  @JsonProperty(Constants.DateValueHasStartMonth, Number, true)
  startMonth?: number = undefined;

  @JsonProperty(Constants.DateValueHasStartYear, Number)
  startYear: number = 0;

  @JsonProperty(Constants.DateValueHasStartEra, String, true)
  startEra?: string = undefined;

  @JsonProperty(Constants.DateValueHasEndDay, Number, true)
  endDay?: number = undefined;

  @JsonProperty(Constants.DateValueHasEndMonth, Number, true)
  endMonth?: number = undefined;

  @JsonProperty(Constants.DateValueHasEndYear, Number)
  endYear: number = 0;

  @JsonProperty(Constants.DateValueHasEndEra, String, true)
  endEra?: string = undefined;

  constructor() {
    super(Constants.DateValue);
  }
}
