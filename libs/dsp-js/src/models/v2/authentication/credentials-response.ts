import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * @category Model V2
 */
@JsonObject('CredentialsResponse')
export class CredentialsResponse {
  @JsonProperty('message')
  message: string = '';
}
