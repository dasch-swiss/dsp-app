import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { UriConverter } from '../../../custom-converters/uri-converter';
import { IBaseUriValue } from '../type-specific-interfaces/base-uri-value';
import { ReadValue } from './read-value';

/**
 * @category Model V2
 */
@JsonObject('ReadUriValue')
export class ReadUriValue extends ReadValue implements IBaseUriValue {
  @JsonProperty(Constants.UriValueAsUri, UriConverter)
  uri: string = '';
}
