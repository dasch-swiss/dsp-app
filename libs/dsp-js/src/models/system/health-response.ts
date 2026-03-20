import { JsonObject, JsonProperty } from 'json2typescript';

/**
 * Represents Knora's state of health.
 *
 * @category Model System
 */
@JsonObject('HealthResponse')
export class HealthResponse {
  /**
   * Message
   */
  @JsonProperty('message', String)
  message: string = '';

  /**
   * Name
   */
  @JsonProperty('name', String)
  name: string = '';

  /**
   * Severity
   */
  @JsonProperty('severity', String)
  severity: string = '';

  /**
   * Status
   */
  @JsonProperty('status', Boolean)
  status: boolean = false;
}
