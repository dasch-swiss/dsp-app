import {
  JsonConvert,
  JsonConverter,
  JsonCustomConvert,
  OperationMode,
  ValueCheckingMode,
  PropertyMatchingRule,
} from 'json2typescript';
import { StringLiteralV2 } from '../string-literal-v2';

/**
 * Converter for list node comments that handles both plain strings
 * and objects with @language/@value properties.
 *
 * The API may return comments as:
 * - Plain string: "Some comment"
 * - Object: { "@language": "en", "@value": "Some comment" }
 * - Array of objects: [{ "@language": "en", "@value": "..." }, ...]
 *
 * @category Internal
 */
@JsonConverter
export class ListNodeCommentsConverter implements JsonCustomConvert<StringLiteralV2[]> {
  static jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  serialize(item: object[]): StringLiteralV2 | StringLiteralV2[] {
    if (item.length > 1) {
      return ListNodeCommentsConverter.jsonConvert.serializeArray(item, StringLiteralV2);
    } else {
      return ListNodeCommentsConverter.jsonConvert.serializeObject(item[0], StringLiteralV2);
    }
  }

  deserialize(item: string | object | object[]): StringLiteralV2[] {
    // Handle plain string (no language tag)
    if (typeof item === 'string') {
      const literal = new StringLiteralV2();
      literal.value = item;
      return [literal];
    }

    if (Array.isArray(item)) {
      // Handle array of strings or objects
      return item.map(i => {
        if (typeof i === 'string') {
          const literal = new StringLiteralV2();
          literal.value = i;
          return literal;
        }
        return ListNodeCommentsConverter.jsonConvert.deserializeObject(i, StringLiteralV2);
      });
    } else {
      return [ListNodeCommentsConverter.jsonConvert.deserializeObject(item, StringLiteralV2)];
    }
  }
}
