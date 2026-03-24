import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseColorValue } from '../type-specific-interfaces/base-color-value';
import { ReadValue } from './read-value';

/**
 * @category Model V2
 */
@JsonObject('ReadColorValue')
export class ReadColorValue extends ReadValue implements IBaseColorValue {
  @JsonProperty(Constants.ColorValueAsColor, String)
  color: string = '';
}
