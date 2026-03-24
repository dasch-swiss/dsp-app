import { JsonConvert, JsonConverter, JsonCustomConvert, OperationMode, ValueCheckingMode } from 'json2typescript';
import { PropertyMatchingRule } from 'json2typescript';
import { StringLiteralV2 } from '../string-literal-v2';

/**
 * @category Internal
 */
@JsonConverter
export class StringLiteralToStringLiteralArrayConverter implements JsonCustomConvert<StringLiteralV2[]> {
  static jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  serialize(item: object[]): StringLiteralV2 | StringLiteralV2[] {
    if (item.length > 1) {
      // array
      return StringLiteralToStringLiteralArrayConverter.jsonConvert.serializeArray(item, StringLiteralV2);
    } else {
      // object
      return StringLiteralToStringLiteralArrayConverter.jsonConvert.serializeObject(item[0], StringLiteralV2);
    }
  }

  deserialize(item: object | object[]): StringLiteralV2[] {
    if (Array.isArray(item)) {
      return StringLiteralToStringLiteralArrayConverter.jsonConvert.deserializeArray(item, StringLiteralV2);
    } else {
      return [StringLiteralToStringLiteralArrayConverter.jsonConvert.deserializeObject(item, StringLiteralV2)];
    }
  }
}
