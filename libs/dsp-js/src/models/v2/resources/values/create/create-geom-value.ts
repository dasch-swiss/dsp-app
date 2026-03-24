import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseGeomValue } from '../type-specific-interfaces/base-geom-value';
import { CreateValue } from './create-value';

/**
 * @category Model V2
 */
@JsonObject('CreateGeomValue')
export class CreateGeomValue extends CreateValue implements IBaseGeomValue {
  @JsonProperty(Constants.GeometryValueAsGeometry, String)
  geometryString: string = '';

  constructor() {
    super(Constants.GeomValue);
  }
}
