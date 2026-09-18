/**
 * @category Internal
 */
export interface IBaseGeolocationValue {
  /**
   * The full GeoSPARQL `wktLiteral`, e.g.
   * `<http://www.opengis.net/def/crs/OGC/1.3/CRS84> POINT(8.55 47.37)`.
   */
  geolocation: string;
}
