import { JsonConverter, JsonCustomConvert } from 'json2typescript';
import { CustomConverterUtils } from '../../../util/utils';

/**
 * @category Internal
 */
@JsonConverter
export class SubPropertyOfConverter implements JsonCustomConvert<string[]> {
  serialize(subproperties: string[]): any {}

  deserialize(items: any): string[] {
    const subPropOf: string[] = [];

    const addItem = (ele: any) => {
      if (ele.hasOwnProperty('@id') && CustomConverterUtils.isString(ele['@id'])) {
        subPropOf.push(ele['@id']);
      }
    };

    if (Array.isArray(items)) {
      items.forEach(item => addItem(item));
    } else {
      addItem(items);
    }

    return subPropOf;
  }
}
