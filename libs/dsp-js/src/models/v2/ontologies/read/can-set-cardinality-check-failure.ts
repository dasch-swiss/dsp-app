import {
  JsonObject,
  JsonProperty,
  JsonConverter,
  JsonCustomConvert,
  JsonConvert,
  OperationMode,
  ValueCheckingMode,
} from 'json2typescript';
import { PropertyMatchingRule } from 'json2typescript';
import { Constants } from '../../Constants';

@JsonObject('ResourceClass')
class ResourceClass {
  @JsonProperty('@id', String)
  id: string = '';
}

@JsonConverter
class CheckFailedConverter implements JsonCustomConvert<ResourceClass[] | ResourceClass> {
  static jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  deserialize(obj: any): ResourceClass[] | ResourceClass {
    let classes: object[];

    if (Array.isArray(obj)) {
      classes = obj;
    } else {
      classes = [obj];
    }

    return classes.map(
      resourceClass => CheckFailedConverter.jsonConvert.deserialize(resourceClass, ResourceClass) as ResourceClass
    );
  }

  serialize(obj: ResourceClass[]): any {}
}

/**
 * A response containing information about context of a failed cardinality update request
 *
 * @category Model V2
 */
@JsonObject('CanSetCardinalityCheckFailure')
export class CanSetCardinalityCheckFailure {
  @JsonProperty(Constants.CanSetCardinalityOntologySubclassCheckFailed, CheckFailedConverter, true)
  canSetCardinalityOntologySubclassCheckFailed?: ResourceClass[] = undefined;

  @JsonProperty(Constants.CanSetCardinalityOntologySuperClassCheckFailed, CheckFailedConverter, true)
  canSetCardinalityOntologySuperClassCheckFailed?: ResourceClass[] = undefined;

  @JsonProperty(Constants.CanSetCardinalityPersistenceCheckFailed, CheckFailedConverter, true)
  canSetCardinalityPersistenceCheckFailed?: ResourceClass[] = undefined;

  @JsonProperty(Constants.CanSetCardinalityKnoraOntologyCheckFailed, CheckFailedConverter, true)
  CanSetCardinalityKnoraOntologyCheckFailed?: ResourceClass[] = undefined;
}
