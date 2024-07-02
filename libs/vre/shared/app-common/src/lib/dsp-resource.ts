import { Constants, ReadResource, SystemPropertyDefinition } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from './property-info-values.interface';

export class DspResource {
  res: ReadResource;

  resProps: PropertyInfoValues[] = []; // array of resource properties

  systemProps: SystemPropertyDefinition[] = []; // array of system properties

  // regions or sequences
  incomingAnnotations: ReadResource[] = [];

  // incoming stillImages, movingImages, audio etc.
  incomingRepresentations: ReadResource[] = [];

  constructor(resource: ReadResource) {
    this.res = resource;
  }

  // return whether the main resource is a region;
  get isRegion() {
    return this.res.entityInfo.classes[Constants.Region];
  }
}

export class DspCompoundPosition {
  offset = 1; // current offset of search requests
  maxOffsets: number; // max offsets in relation to totalPages
  position: number; // current item position in offset sequence
  page = 1; // current and real page number in compound object
  totalPages: number; // total pages (part of) in compound object

  constructor(totalPages: number) {
    this.totalPages = totalPages;
    this.maxOffsets = Math.ceil(totalPages / 25) - 1;
  }
}
