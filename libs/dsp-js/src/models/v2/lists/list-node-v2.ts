import {
  JsonConvert,
  JsonConverter,
  JsonCustomConvert,
  JsonObject,
  JsonProperty,
  OperationMode,
  PropertyMatchingRule,
  ValueCheckingMode,
} from 'json2typescript';
import { Constants } from '../Constants';
import { IdConverter } from '../custom-converters/id-converter';

/**
 * @category Internal
 */
@JsonConverter
export class SubListNodeConverter implements JsonCustomConvert<ListNodeV2[]> {
  static jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  serialize(subclasses: ListNodeV2[]): any {}

  deserialize(subnodes: any): ListNodeV2[] {
    let children: object[];

    if (Array.isArray(subnodes)) {
      children = subnodes;
    } else {
      children = [subnodes];
    }

    return children.map(child => SubListNodeConverter.jsonConvert.deserialize(child, ListNodeV2) as ListNodeV2);
  }
}

/**
 * @category Model V2
 */
@JsonObject('ListNodeV2')
export class ListNodeV2 {
  @JsonProperty('@id', String)
  id: string = '';

  @JsonProperty(Constants.Label, String)
  label: string = '';

  @JsonProperty(Constants.IsRootNode, Boolean, true)
  isRootNode: boolean = false;

  @JsonProperty(Constants.HasRootNode, IdConverter, true)
  hasRootNode?: string = undefined;

  @JsonProperty(Constants.HasSubListNode, SubListNodeConverter, true)
  children: ListNodeV2[] = [];
}
