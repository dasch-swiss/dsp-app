import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IdConverter } from '../../../custom-converters/id-converter';
import { IBaseLinkValue } from '../type-specific-interfaces/base-link-value';
import { UpdateValue } from './update-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateLinkValue')
export class UpdateLinkValue extends UpdateValue implements IBaseLinkValue {
  @JsonProperty(Constants.LinkValueHasTargetIri, IdConverter)
  linkedResourceIri: string = '';

  constructor() {
    super(Constants.LinkValue);
  }
}
