import { JsonObject, JsonProperty } from 'json2typescript';
import { CreateValue } from '../../../../models/v2/resources/values/create/create-value';
import { Constants } from '../../Constants';
import { DateTimeStampConverter } from '../../custom-converters/date-time-stamp-converter';
import { IdConverter } from '../../custom-converters/id-converter';

/**
 * @category Model V2
 */
@JsonObject('CreateResource')
export class CreateResource {
  @JsonProperty('@type', String)
  type: string = '';

  @JsonProperty(Constants.Label, String)
  label: string = '';

  @JsonProperty(Constants.HasPermissions, String, true)
  hasPermissions?: string = undefined;

  @JsonProperty(Constants.AttachedToProject, IdConverter)
  attachedToProject: string = '';

  @JsonProperty(Constants.AttachedToUser, IdConverter, true)
  attachedToUser?: string = undefined;

  @JsonProperty(Constants.CreationDate, DateTimeStampConverter, true)
  creationDate?: string = undefined;

  properties: { [index: string]: CreateValue[] } = {};
}
