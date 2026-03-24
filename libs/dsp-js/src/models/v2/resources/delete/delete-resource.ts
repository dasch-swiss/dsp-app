import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';
import { DateTimeStampConverter } from '../../custom-converters/date-time-stamp-converter';

/**
 * @category Model V2
 */
@JsonObject('DeleteResource')
export class DeleteResource {
  @JsonProperty('@id', String)
  id: string = '';

  @JsonProperty('@type', String)
  type: string = '';

  @JsonProperty(Constants.LastModificationDate, DateTimeStampConverter, true)
  lastModificationDate?: string = undefined;

  @JsonProperty(Constants.DeleteComment, String, true)
  deleteComment?: string = undefined;
}
