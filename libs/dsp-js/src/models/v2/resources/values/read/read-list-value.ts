import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IdConverter } from '../../../custom-converters/id-converter';
import { IBaseListValue } from '../type-specific-interfaces/base-list-value';
import { ReadValue } from './read-value';

/**
 * @category Model V2
 */
@JsonObject('ReadListValue')
export class ReadListValue extends ReadValue implements IBaseListValue {
  @JsonProperty(Constants.ListValueAsListNode, IdConverter)
  listNode: string = '';

  listNodeLabel!: string;
}
