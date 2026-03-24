import { JsonObject, JsonProperty } from 'json2typescript';

@JsonObject('License')
export class License {
  @JsonProperty('@id', String)
  id: string = '';
}
