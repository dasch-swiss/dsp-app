import { JsonConverter, JsonCustomConvert } from 'json2typescript';
import { CustomConverterUtils } from '../../../util/utils';

/**
 * @category Internal
 */
@JsonConverter
export class GroupsPerProjectConverter implements JsonCustomConvert<{ [key: string]: string[] }> {
  serialize(groups: { [key: string]: string[] }): any {
    return {};
  }

  deserialize(item: any): { [key: string]: string[] } {
    const outputObj: { [key: string]: string[] } = {};
    const keys = Object.keys(item);

    keys.forEach((key: string) => {
      const groupInputArray = item[key];

      outputObj[key] = groupInputArray.map((element: string) => {
        if (CustomConverterUtils.isString(element)) {
          return element;
        } else {
          throw new Error('Expected string, got ' + element);
        }
      });
    });

    return outputObj;
  }
}
