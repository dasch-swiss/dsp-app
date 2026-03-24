import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';
import { DateTimeStampConverter } from '../../custom-converters/date-time-stamp-converter';

/**
 * @category Model V2
 */
@JsonObject('UpdateResourceMetadataResponse')
export class UpdateResourceMetadataResponse {
  @JsonProperty(Constants.ResourceIri, String)
  resourceIri: string = '';

  @JsonProperty(Constants.ResourceClassIri, String)
  resourceClassIri: string = '';

  @JsonProperty(Constants.Label, String, true)
  label?: string = '';

  @JsonProperty(Constants.LastModificationDate, DateTimeStampConverter, true)
  lastModificationDate?: string = '';

  @JsonProperty(Constants.HasPermissions, String, true)
  hasPermissions?: string = '';
}
