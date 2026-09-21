import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseGeolocationValue } from '../type-specific-interfaces/base-geolocation-value';
import { ReadValue } from './read-value';

/**
 * A geographic location. Read carries four fields where create and update carry only the literal:
 * the CRS, shape and coordinates are read-only projections dsp-api derives from it, so that a client
 * dispatches on a declared shape instead of parsing the literal itself.
 *
 * @category Model V2
 */
@JsonObject('ReadGeolocationValue')
export class ReadGeolocationValue extends ReadValue implements IBaseGeolocationValue {
  @JsonProperty(Constants.GeolocationValueAsGeolocation, String)
  geolocation = '';

  // The third argument marks the field optional: the three derived fields are ZeroOrOne in the
  // dsp-api ontology, so a strict mapping would break the moment the server omits one.
  @JsonProperty(Constants.GeolocationValueHasCrs, String, true)
  crs = '';

  @JsonProperty(Constants.GeolocationValueHasShape, String, true)
  shape = '';

  @JsonProperty(Constants.GeolocationValueHasCoordinates, String, true)
  coordinates = '';
}
