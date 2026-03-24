import { JsonConverter, JsonCustomConvert } from 'json2typescript';
import { Constants } from '../Constants';
import { CustomConverterUtils } from '../../../util/utils';

/**
 * @category Internal
 */
@JsonConverter
export class DecimalConverter implements JsonCustomConvert<number> {
  serialize(decimal: number): any {
    return {
      '@type': Constants.XsdDecimal,
      '@value': decimal.toPrecision(),
    };
  }

  deserialize(item: any): number {
    if (Array.isArray(item)) throw new Error('Expected a single element');

    if (!item.hasOwnProperty('@type') || item['@type'] !== Constants.XsdDecimal)
      throw new Error('Not of expected type xsd:decimal');

    // xsd:decimal is encoded as a string
    if (item.hasOwnProperty('@value') && CustomConverterUtils.isString(item['@value'])) {
      return Number(item['@value']);
    } else {
      throw new Error('No @value given for decimal value');
    }
  }
}
