import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';
import { BaseValue } from './base-value';

/**
 * @category Internal
 */
@JsonObject('WriteValue')
export abstract class WriteValue extends BaseValue {
  @JsonProperty(Constants.HasPermissions, String, true)
  hasPermissions?: string = undefined;

  @JsonProperty(Constants.ValueHasComment, String, true)
  valueHasComment?: string = undefined;
}
