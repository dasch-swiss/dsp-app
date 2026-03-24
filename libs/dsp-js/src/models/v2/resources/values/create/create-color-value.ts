import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseColorValue } from '../type-specific-interfaces/base-color-value';
import { CreateValue } from './create-value';

/**
 * @category Model V2
 */
@JsonObject('CreateColorValue')
export class CreateColorValue extends CreateValue implements IBaseColorValue {
  @JsonProperty(Constants.ColorValueAsColor, String)
  color: string = '';

  constructor() {
    super(Constants.ColorValue);
  }
}
