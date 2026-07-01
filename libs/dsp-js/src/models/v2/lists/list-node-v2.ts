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
import { ListNodeCommentsConverter } from '../custom-converters/list-node-comments-converter';
import { StringLiteralToStringConverter } from '../custom-converters/string-literal-to-string-converter';
import { StringLiteralToStringLiteralArrayConverter } from '../custom-converters/string-literal-to-string-literal-array-converter';
import { StringLiteralV2 } from '../string-literal-v2';

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
 * @category Internal
 */
@JsonConverter
export class SubListNodeWithAllLanguagesConverter implements JsonCustomConvert<ListNodeV2WithAllLanguages[]> {
  static jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  serialize(subclasses: ListNodeV2WithAllLanguages[]): any {}

  deserialize(subnodes: any): ListNodeV2WithAllLanguages[] {
    let children: object[];

    if (Array.isArray(subnodes)) {
      children = subnodes;
    } else {
      children = [subnodes];
    }

    return children.map(
      child =>
        SubListNodeWithAllLanguagesConverter.jsonConvert.deserialize(
          child,
          ListNodeV2WithAllLanguages
        ) as ListNodeV2WithAllLanguages
    );
  }
}

/**
 * @category Model V2
 */
@JsonObject('ListNodeV2')
export class ListNodeV2 {
  @JsonProperty('@id', String)
  id = '';

  @JsonProperty(Constants.Label, String)
  label = '';

  @JsonProperty(Constants.Comment, ListNodeCommentsConverter, true)
  comments: StringLiteralV2[] = [];

  @JsonProperty(Constants.IsRootNode, Boolean, true)
  isRootNode = false;

  @JsonProperty(Constants.HasRootNode, IdConverter, true)
  hasRootNode?: string = undefined;

  @JsonProperty(Constants.HasSubListNode, SubListNodeConverter, true)
  children: ListNodeV2[] = [];
}

/**
 * Variant of {@link ListNodeV2} for responses returned with allLanguages=true,
 * where `rdfs:label` is an array of language-tagged literals instead of a
 * single string. Adds `labels` alongside the inherited single-string `label`,
 * mirroring {@link ResourceClassDefinitionWithAllLanguages}.
 *
 * @category Model V2
 */
@JsonObject('ListNodeV2WithAllLanguages')
export class ListNodeV2WithAllLanguages extends ListNodeV2 {
  @JsonProperty(Constants.Label, StringLiteralToStringConverter, true)
  override label = '';

  @JsonProperty(Constants.Label, StringLiteralToStringLiteralArrayConverter, true)
  labels: StringLiteralV2[] = [];

  @JsonProperty(Constants.HasSubListNode, SubListNodeWithAllLanguagesConverter, true)
  override children: ListNodeV2WithAllLanguages[] = [];
}
