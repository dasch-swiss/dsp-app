import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseColorValue } from '../type-specific-interfaces/base-color-value';
import { UpdateValue } from './update-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateColorValue')
export class UpdateColorValue extends UpdateValue implements IBaseColorValue {
  @JsonProperty(Constants.ColorValueAsColor, String)
  color: string = '';

  constructor() {
    super(Constants.ColorValue);
  }
}
