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
}

export class DspCompoundPosition {
  offset = 1; // current offset of search requests
  maxOffsets: number; // max offsets in relation to totalPages
  private _position = 1; // current item position in offset sequence
  private _page = 1; // current and real page number in compound object
  totalPages: number; // total pages (part of) in compound object

  get isLastPage() {
    return this._page >= this.totalPages;
  }

  constructor(totalPages: number) {
    this.totalPages = totalPages;
    this.maxOffsets = Math.ceil(totalPages / 25) - 1;
  }

  get page() {
    return this._page;
  }

  set page(page: number) {
    this._page = page;
    this.offset = Math.ceil(page / 25) - 1;
    this._position = Math.floor(page - this.offset * 25 - 1);
  }

  get position() {
    return this._position;
  }

  set position(position: number) {
    this._position = position;
    this.page = this.offset * 25 + position + 1;
  }
}
