import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { UriConverter } from '../../../custom-converters/uri-converter';
import { IBaseUriValue } from '../type-specific-interfaces/base-uri-value';
import { UpdateValue } from './update-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateUriValue')
export class UpdateUriValue extends UpdateValue implements IBaseUriValue {
  @JsonProperty(Constants.UriValueAsUri, UriConverter)
  uri: string = '';

  constructor() {
    super(Constants.UriValue);
  }
}
