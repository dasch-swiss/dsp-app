import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseGeolocationValue } from '../type-specific-interfaces/base-geolocation-value';
import { CreateValue } from './create-value';

/**
 * @category Model V2
 */
@JsonObject('CreateGeolocationValue')
export class CreateGeolocationValue extends CreateValue implements IBaseGeolocationValue {
  @JsonProperty(Constants.GeolocationValueAsGeolocation, String)
  geolocation = '';

  constructor() {
    super(Constants.GeolocationValue);
  }
}
