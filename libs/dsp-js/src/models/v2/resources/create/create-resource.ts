import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';
import { DateTimeStampConverter } from '../../custom-converters/date-time-stamp-converter';
import { IdConverter } from '../../custom-converters/id-converter';
import { CreateValue } from '../values/create/create-value';

/**
 * @category Model V2
 */
@JsonObject('CreateResource')
export class CreateResource {
  @JsonProperty('@type', String)
  type = '';

  @JsonProperty(Constants.Label, String)
  label = '';

  @JsonProperty(Constants.HasPermissions, String, true)
  hasPermissions?: string = undefined;

  @JsonProperty(Constants.AttachedToProject, IdConverter)
  attachedToProject = '';

  @JsonProperty(Constants.AttachedToUser, IdConverter, true)
  attachedToUser?: string = undefined;

  @JsonProperty(Constants.CreationDate, DateTimeStampConverter, true)
  creationDate?: string = undefined;

  // Per-resource (data-side) authorship; serialized to knora-api:hasResourceAuthorship when set.
  // TODO(verify-locally): confirm CreateResource serialization includes this @JsonProperty in the POST body.
  @JsonProperty(Constants.hasResourceAuthorship, [String], true)
  resourceAuthorship?: string[] = undefined;

  properties: { [index: string]: CreateValue[] } = {};
}
