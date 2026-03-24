import { JsonConverter, JsonCustomConvert } from 'json2typescript';

/**
 * @category Internal
 */
@JsonConverter
export class UnionStringArrayOfStringsConverter implements JsonCustomConvert<string[]> {
  serialize(el: string[]): any {
    if (Array.isArray(el)) {
      return el as any[];
    } else {
      throw new Error(`Serialization Error: expected string[] type. Instead got ${typeof el}.`);
    }
  }

  deserialize(el: any): string[] {
    if (Array.isArray(el)) {
      return el as string[];
    } else if (!Array.isArray(el)) {
      return [el] as string[];
    } else {
      throw new Error(`Deserialization Error: expected string or string[] type. 
                Instead got ${typeof el}.`);
    }
  }
}
