import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseGeolocationValue } from '../type-specific-interfaces/base-geolocation-value';
import { UpdateValue } from './update-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateGeolocationValue')
export class UpdateGeolocationValue extends UpdateValue implements IBaseGeolocationValue {
  @JsonProperty(Constants.GeolocationValueAsGeolocation, String)
  geolocation = '';

  constructor() {
    super(Constants.GeolocationValue);
  }
}
