import { Constants, ReadResource, ReadValue, SystemPropertyDefinition } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from './properties/properties.component';

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

  get hasOutgoingReferences() {
    return this.res.outgoingReferences.length > 0;
  }
}

export class DspCompoundPosition {
  offset: number; // current offset of search requests
  maxOffsets: number; // max offsets in relation to totalPages
  position: number; // current item position in offset sequence
  page: number; // current and real page number in compound object
  totalPages: number; // total pages (part of) in compound object

  constructor(totalPages: number) {
    this.totalPages = totalPages;
    this.maxOffsets = Math.ceil(totalPages / 25) - 1;
  }
}

export interface PropIriToNameMapping {
  [index: string]: string;
}

export interface PropertyValues {
  [index: string]: ReadValue[];
}
