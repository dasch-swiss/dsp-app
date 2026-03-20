import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * @category Internal
 */
@JsonObject('BaseResource')
export abstract class BaseResource {
  @JsonProperty('@type', String)
  type: string = '';
}
