import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IdConverter } from '../../../custom-converters/id-converter';
import { CreateValue } from './create-value';

/**
 * @category Model V2
 */
@JsonObject('CreateRegionPreviewValue')
export class CreateRegionPreviewValue extends CreateValue {
  @JsonProperty(Constants.IsRegionPreviewOf, IdConverter)
  regionIri = '';

  constructor() {
    super(Constants.RegionPreviewValue);
  }
}
