import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseGeomValue } from '../type-specific-interfaces/base-geom-value';
import { ReadValue } from './read-value';

/**
 * @category Internal
 */
@JsonObject('ReadGeomValue')
export class ParseReadGeomValue extends ReadValue implements IBaseGeomValue {
  @JsonProperty(Constants.GeometryValueAsGeometry, String)
  geometryString: string = '';
}

/**
 * Represents a point in a 2D-coordinate system (for geometry values).
 *
 * @category Model V2
 */
export class Point2D {
  constructor(
    public x: number,
    public y: number
  ) {}
}

/**
 * Represents a geometry value parsed from JSON.
 *
 * @category Model V2
 */
export class RegionGeometry {
  constructor(
    public status: string,
    public lineColor: string,
    public lineWidth: number,
    public points: Point2D[],
    public type: string,
    public radius?: Point2D
  ) {}
}

/**
 * @category Model V2
 */
export class ReadGeomValue extends ReadValue {
  geometry: RegionGeometry;

  constructor(geometry: ParseReadGeomValue) {
    super(
      geometry.id,
      geometry.type,
      geometry.attachedToUser,
      geometry.arkUrl,
      geometry.versionArkUrl,
      geometry.valueCreationDate,
      geometry.hasPermissions,
      geometry.userHasPermission,
      geometry.uuid,
      geometry.propertyLabel,
      geometry.propertyComment,
      geometry.property,
      'GEOMETRY',
      geometry.valueHasComment
    );

    const geometryJSON = JSON.parse(geometry.geometryString);

    const points: Point2D[] = [];
    for (const point of geometryJSON.points) {
      points.push(new Point2D(point.x, point.y));
    }

    let radius;
    if (geometryJSON.radius) {
      radius = new Point2D(geometryJSON.radius.x, geometryJSON.radius.y);
    }

    this.geometry = new RegionGeometry(
      geometryJSON.status,
      geometryJSON.lineColor,
      geometryJSON.lineWidth,
      points,
      geometryJSON.type,
      radius
    );
  }
}
