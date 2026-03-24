import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';
import { HasCardinalityForPropertyConverter } from '../../custom-converters/has-cardinality-for-property-converter';
import { IHasProperty } from '../class-definition';
import { UpdateDeleteEntity } from '../update-delete-entity';

/**
 * @category Model V2
 */
@JsonObject('UpdateResourceClassCardinality')
export class UpdateResourceClassCardinality {
  @JsonProperty('@id', String)
  id: string = '';

  @JsonProperty('@type', String)
  type: string = Constants.Class;

  @JsonProperty(Constants.SubClassOf, HasCardinalityForPropertyConverter)
  cardinalities: IHasProperty[] = [];
}
