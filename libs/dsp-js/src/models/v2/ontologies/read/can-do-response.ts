import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';
import { CannotDoContext } from './cannot-do-context';

/**
 * @category Model V2
 */
@JsonObject('CanDoResponse')
export class CanDoResponse {
  @JsonProperty(Constants.CanDo, Boolean)
  canDo: boolean = true;

  @JsonProperty(Constants.CannotDoReason, String, true)
  cannotDoReason?: string = undefined;

  @JsonProperty(Constants.CannotDoContext, CannotDoContext, true)
  cannotDoContext?: CannotDoContext = undefined;
}
