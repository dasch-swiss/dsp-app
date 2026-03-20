import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseGeonameValue } from '../type-specific-interfaces/base-geoname-value';
import { UpdateValue } from './update-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateGeonameValue')
export class UpdateGeonameValue extends UpdateValue implements IBaseGeonameValue {
  @JsonProperty(Constants.GeonameValueAsGeonameCode, String)
  geoname: string = '';

  constructor() {
    super(Constants.GeonameValue);
  }
}
