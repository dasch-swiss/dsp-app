import { ReadIntervalValue, ReadLinkValue, ReadTextValueAsString } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';

export interface Segment {
  resource: DspResource;
  row: number;
  label: string;
  hasSegmentBounds: ReadIntervalValue;
  hasVideoSegmentOfValue: ReadLinkValue | undefined;
  hasComment: ReadTextValueAsString | undefined;
  hasDescription: ReadTextValueAsString | undefined;
  hasKeyword: ReadTextValueAsString | undefined;
  hasTitle: ReadTextValueAsString | undefined;
}
