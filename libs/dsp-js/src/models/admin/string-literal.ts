import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * A string with an optional language tag.
 *
 * @category Model Admin
 */
@JsonObject('StringLiteral')
export class StringLiteral {
  /**
   * The language of a string literal.
   */
  @JsonProperty('language', String, true)
  language?: string = undefined;

  /**
   * The value of a string literal.
   */
  @JsonProperty('value', String)
  value: string = '';
}
