import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { BaseValue } from '../base-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateValuePermissions')
export class UpdateValuePermissions extends BaseValue {
  @JsonProperty('@id', String)
  id: string = '';

  @JsonProperty(Constants.HasPermissions, String)
  hasPermissions: string = '';
}
