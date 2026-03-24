import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IdConverter } from '../../../custom-converters/id-converter';
import { IBaseListValue } from '../type-specific-interfaces/base-list-value';
import { UpdateValue } from './update-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateListValue')
export class UpdateListValue extends UpdateValue implements IBaseListValue {
  @JsonProperty(Constants.ListValueAsListNode, IdConverter)
  listNode: string = '';

  constructor() {
    super(Constants.ListValue);
  }
}
