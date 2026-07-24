import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IdConverter } from '../../../custom-converters/id-converter';
import { UpdateValue } from './update-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateRegionPreviewValue')
export class UpdateRegionPreviewValue extends UpdateValue {
  @JsonProperty(Constants.IsRegionPreviewOf, IdConverter)
  regionIri = '';

  constructor() {
    super(Constants.RegionPreviewValue);
  }
}
