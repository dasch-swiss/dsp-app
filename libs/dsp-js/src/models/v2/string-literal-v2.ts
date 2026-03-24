import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * A string with an optional language tag.
 *
 * @category Model V2
 */
@JsonObject('StringLiteralV2')
export class StringLiteralV2 {
  /**
   * The language of a string literal.
   */
  @JsonProperty('@language', String, true)
  language?: string = undefined;

  /**
   * The value of a string literal.
   */
  @JsonProperty('@value', String)
  value: string = '';
}
