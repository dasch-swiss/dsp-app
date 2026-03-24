import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseBooleanValue } from '../type-specific-interfaces/base-boolean-value';
import { ReadValue } from './read-value';

/**
 * @category Model V2
 */
@JsonObject('ReadBooleanValue')
export class ReadBooleanValue extends ReadValue implements IBaseBooleanValue {
  @JsonProperty(Constants.BooleanValueAsBoolean, Boolean)
  bool: boolean = false;
}
