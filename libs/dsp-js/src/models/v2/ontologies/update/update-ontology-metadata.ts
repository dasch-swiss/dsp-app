import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';
import { DateTimeStampConverter } from '../../custom-converters/date-time-stamp-converter';

/**
 * @category Model V2
 */
@JsonObject('UpdateOntologyMetadata')
export class UpdateOntologyMetadata {
  @JsonProperty('@id', String)
  id: string = '';

  @JsonProperty(Constants.LastModificationDate, DateTimeStampConverter, true)
  lastModificationDate!: string;

  @JsonProperty(Constants.Label, String, true)
  label?: string = undefined;

  @JsonProperty(Constants.Comment, String, true)
  comment?: string = undefined;
}
