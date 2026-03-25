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
  message = '';

  /**
   * Name
   */
  @JsonProperty('name', String)
  name = '';

  /**
   * Severity
   */
  @JsonProperty('severity', String)
  severity = '';

  /**
   * Status
   */
  @JsonProperty('status', Boolean)
  status = false;
}
