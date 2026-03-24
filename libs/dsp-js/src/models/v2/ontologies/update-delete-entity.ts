import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../Constants';
import { DateTimeStampConverter } from '../custom-converters/date-time-stamp-converter';

/**
 * @category Internal
 */
@JsonObject('UpdateDeleteEntity')
export abstract class UpdateDeleteEntity {
  @JsonProperty('@id', String)
  id: string = '';

  @JsonProperty(Constants.LastModificationDate, DateTimeStampConverter, true)
  lastModificationDate!: string;
}
