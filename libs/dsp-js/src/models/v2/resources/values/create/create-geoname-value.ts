import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseGeonameValue } from '../type-specific-interfaces/base-geoname-value';
import { CreateValue } from './create-value';

/**
 * @category Model V2
 */
@JsonObject('CreateGeonameValue')
export class CreateGeonameValue extends CreateValue implements IBaseGeonameValue {
  @JsonProperty(Constants.GeonameValueAsGeonameCode, String)
  geoname: string = '';

  constructor() {
    super(Constants.GeonameValue);
  }
}
