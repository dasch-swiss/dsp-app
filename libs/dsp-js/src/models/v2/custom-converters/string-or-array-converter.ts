import { JsonCustomConvert, JsonConverter } from 'json2typescript';

@JsonConverter
export class StringOrArrayToArrayConverter implements JsonCustomConvert<string[]> {
  serialize(data: string[]): any {
    return data;
  }

  deserialize(data: any): string[] {
    if (typeof data === 'string') {
      return [data];
    } else if (Array.isArray(data)) {
      return data;
    } else {
      throw new Error('Expected a string or string[]');
    }
  }
}
