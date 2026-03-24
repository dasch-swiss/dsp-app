import {
  JsonConvert,
  JsonConverter,
  JsonCustomConvert,
  JsonObject,
  JsonProperty,
  OperationMode,
  ValueCheckingMode,
} from 'json2typescript';
import { PropertyMatchingRule } from 'json2typescript';
import { Constants } from '../../Constants';
import { CanSetCardinalityCheckFailure } from './can-set-cardinality-check-failure';

@JsonConverter
class CheckFailureConverter implements JsonCustomConvert<
  CanSetCardinalityCheckFailure[] | CanSetCardinalityCheckFailure
> {
  static jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  deserialize(obj: any): CanSetCardinalityCheckFailure[] | CanSetCardinalityCheckFailure {
    let classes: object[];

    if (Array.isArray(obj)) {
      classes = obj;
    } else {
      classes = [obj];
    }

    return classes.map(
      resourceClass =>
        CheckFailureConverter.jsonConvert.deserialize(
          resourceClass,
          CanSetCardinalityCheckFailure
        ) as CanSetCardinalityCheckFailure
    );
  }

  serialize(obj: CanSetCardinalityCheckFailure[]): any {}
}

/**
 * A response containing information about context of a failed cardinality update request
 *
 * @category Model V2
 */
@JsonObject('CannotDoContext')
export class CannotDoContext {
  /**
   * Provides context about why a cardinality update could not happen.
   */
  @JsonProperty(Constants.CanSetCardinalityCheckFailure, CheckFailureConverter)
  canSetCardinalityCheckFailure: CanSetCardinalityCheckFailure[] = [];
}
