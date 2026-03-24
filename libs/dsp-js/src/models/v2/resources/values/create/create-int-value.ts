import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseIntValue } from '../type-specific-interfaces/base-int-value';
import { CreateValue } from './create-value';

/**
 * @category Model V2
 */
@JsonObject('CreateIntValue')
export class CreateIntValue extends CreateValue implements IBaseIntValue {
  @JsonProperty(Constants.IntValueAsInt, Number)
  int: number = 0;

  constructor() {
    super(Constants.IntValue);
  }
}
