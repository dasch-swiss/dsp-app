import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseGeomValue } from '../type-specific-interfaces/base-geom-value';
import { UpdateValue } from './update-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateGeomValue')
export class UpdateGeomValue extends UpdateValue implements IBaseGeomValue {
  @JsonProperty(Constants.GeometryValueAsGeometry, String)
  geometryString: string = '';

  constructor() {
    super(Constants.GeomValue);
  }
}
