import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { BaseValue } from '../base-value';

/**
 * @category Model V2
 */
@JsonObject('DeleteValue')
export class DeleteValue extends BaseValue {
  @JsonProperty('@id', String)
  id: string = '';

  @JsonProperty(Constants.DeleteComment, String, true)
  deleteComment?: string = undefined;
}
