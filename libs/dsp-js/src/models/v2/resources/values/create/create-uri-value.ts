import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { UriConverter } from '../../../custom-converters/uri-converter';
import { IBaseUriValue } from '../type-specific-interfaces/base-uri-value';
import { CreateValue } from './create-value';

/**
 * @category Model V2
 */
@JsonObject('CreateUriValue')
export class CreateUriValue extends CreateValue implements IBaseUriValue {
  @JsonProperty(Constants.UriValueAsUri, UriConverter)
  uri: string = '';

  constructor() {
    super(Constants.UriValue);
  }
}
