import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * @category Internal
 */
@JsonObject('UpdateEntityCommentOrLabel')
export abstract class UpdateEntityCommentOrLabel {
  @JsonProperty('@id', String)
  id: string = '';

  /**
   * Type will be assigned on construction.
   */
  @JsonProperty('@type', String)
  readonly type: string = '';

  constructor(type: string) {
    this.type = type;
  }
}
