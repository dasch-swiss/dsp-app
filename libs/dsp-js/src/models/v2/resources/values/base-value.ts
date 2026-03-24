import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * @category Internal
 */
@JsonObject('BaseValue')
export abstract class BaseValue {
  @JsonProperty('@type', String)
  type: string = '';
}
