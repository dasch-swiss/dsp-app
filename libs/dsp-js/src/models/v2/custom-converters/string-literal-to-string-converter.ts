import { JsonConvert, JsonConverter, JsonCustomConvert, OperationMode, ValueCheckingMode } from 'json2typescript';
import { PropertyMatchingRule } from 'json2typescript';
import { StringLiteralV2 } from '../string-literal-v2';

/**
 * @category Internal
 */
@JsonConverter
export class StringLiteralToStringConverter implements JsonCustomConvert<string> {
  static jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  serialize(item: string): any {
    return;
  }

  deserialize(item: object | object[]): string {
    if (Array.isArray(item) && item.length > 0) {
      const stringLit = item[0];
      return StringLiteralToStringConverter.jsonConvert.deserializeObject(stringLit, StringLiteralV2).value;
    } else {
      return StringLiteralToStringConverter.jsonConvert.deserializeObject(item, StringLiteralV2).value;
    }
  }
}
