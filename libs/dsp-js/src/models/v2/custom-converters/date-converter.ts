import { JsonConverter, JsonCustomConvert } from 'json2typescript';
import { Constants } from '../Constants';

/**
 * @category Internal
 */
@JsonConverter
export class DateConverter implements JsonCustomConvert<string> {
  serialize(dateObject: string): any {
    return {
      '@type': Constants.XsdDate,
      '@value': dateObject,
    };
  }

  deserialize(dateObject: any): string {
    if (!dateObject.hasOwnProperty('@type') || dateObject['@type'] !== Constants.XsdDate)
      throw new Error('Not of expected type xsd:date');

    // return new Date(dateObject["@value"]);
    return dateObject['@value'];
  }
}
