import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * A response providing project keywords.
 *
 * @category Model Admin
 */
@JsonObject('KeywordsResponse')
export class KeywordsResponse {
  /**
   * Project keywords.
   */
  @JsonProperty('keywords', [String])
  keywords: string[] = [];
}
