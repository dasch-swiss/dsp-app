import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseIntValue } from '../type-specific-interfaces/base-int-value';
import { ReadValue } from './read-value';

/**
 * @category Model V2
 */
@JsonObject('ReadIntValue')
export class ReadIntValue extends ReadValue implements IBaseIntValue {
  @JsonProperty(Constants.IntValueAsInt, Number)
  int: number = 0;
}
