import { Constants, ReadGeomValue, ReadResource } from '@dasch-swiss/dsp-js';

export class Region {
  /**
   *
   * @param regionResource a resource of type Region
   */
  constructor(readonly regionResource: ReadResource) {}

  /**
   * get all geometry information belonging to this region.
   *
   */
  getGeometries() {
    return this.regionResource.properties[Constants.HasGeometry] as ReadGeomValue[];
  }
}
