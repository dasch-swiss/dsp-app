import { ReadResource, RegionGeometry } from '@dasch-swiss/dsp-js';

export class GeometryForRegion {
  constructor(
    readonly geometry: RegionGeometry,
    readonly region: ReadResource
  ) {}
}
