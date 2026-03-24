import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IdConverter } from '../../../custom-converters/id-converter';
import { IBaseLinkValue } from '../type-specific-interfaces/base-link-value';
import { CreateValue } from './create-value';

/**
 * @category Model V2
 */
@JsonObject('CreateLinkValue')
export class CreateLinkValue extends CreateValue implements IBaseLinkValue {
  @JsonProperty(Constants.LinkValueHasTargetIri, IdConverter)
  linkedResourceIri: string = '';

  constructor() {
    super(Constants.LinkValue);
  }
}
