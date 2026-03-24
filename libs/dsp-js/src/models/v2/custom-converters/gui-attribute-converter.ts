import { JsonConverter, JsonCustomConvert } from 'json2typescript';

/**
 * @category Internal
 */
@JsonConverter
export class GuiAttributeConverter implements JsonCustomConvert<string[]> {
  serialize(attrs: string[]): any {}

  deserialize(attrs: any): string[] {
    let guiAttributes: string[];

    if (Array.isArray(attrs)) {
      guiAttributes = attrs;
    } else {
      guiAttributes = [attrs];
    }

    return guiAttributes;
  }
}
