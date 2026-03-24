import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';

/**
 * @category Model V2
 */
@JsonObject('DeleteOntologyResponse')
export class DeleteOntologyResponse {
  @JsonProperty(Constants.Result, String)
  result: string = '';
}
