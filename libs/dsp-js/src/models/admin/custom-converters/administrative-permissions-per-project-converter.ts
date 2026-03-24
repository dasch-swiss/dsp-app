import { JsonConvert, JsonConverter, JsonCustomConvert, OperationMode, ValueCheckingMode } from 'json2typescript';
import { PropertyMatchingRule } from 'json2typescript';

import { Permission } from '../permission';

/**
 * @category Internal
 */
@JsonConverter
export class AdministrativePermissionsPerProjectConverter implements JsonCustomConvert<{
  [key: string]: Permission[];
}> {
  static jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  serialize(permissions: { [key: string]: Permission[] }): any {
    return {};
  }

  deserialize(item: any): { [key: string]: Permission[] } {
    const outputObj: { [key: string]: Permission[] } = {};
    const keys = Object.keys(item);

    keys.forEach((key: string) => {
      const permInputArray = item[key];

      outputObj[key] = permInputArray.map((element: any) => {
        return AdministrativePermissionsPerProjectConverter.jsonConvert.deserializeObject(element, Permission);
      });
    });

    return outputObj;
  }
}
