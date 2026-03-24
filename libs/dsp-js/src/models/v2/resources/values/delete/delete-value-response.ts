import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';

/**
 * @category Model V2
 */
@JsonObject('DeleteValueResponse')
export class DeleteValueResponse {
  @JsonProperty(Constants.Result, String)
  result: string = '';
}
