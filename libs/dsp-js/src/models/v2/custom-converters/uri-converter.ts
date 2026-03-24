import { JsonConverter, JsonCustomConvert } from 'json2typescript';
import { CustomConverterUtils } from '../../../util/utils';
import { Constants } from '../Constants';

/**
 * @category Internal
 */
@JsonConverter
export class UriConverter implements JsonCustomConvert<string> {
  serialize(uri: string): any {
    return {
      '@type': Constants.XsdAnyUri,
      '@value': uri,
    };
  }

  deserialize(item: any): string {
    let uri = '';

    if (Array.isArray(item)) throw new Error('Expected a single element');

    if (!item.hasOwnProperty('@type') || item['@type'] !== Constants.XsdAnyUri)
      throw new Error('Not of expected type xsd:anyURI');

    if (item.hasOwnProperty('@value') && CustomConverterUtils.isString(item['@value'])) {
      uri = item['@value'];
    }

    return uri;
  }
}
