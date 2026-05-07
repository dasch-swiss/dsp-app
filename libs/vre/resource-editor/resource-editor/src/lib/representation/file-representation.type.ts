import { Constants } from '@dasch-swiss/dsp-js';

export type FileRepresentationType =
  | typeof Constants.HasMovingImageFileValue
  | typeof Constants.HasAudioFileValue
  | typeof Constants.HasDocumentFileValue
  | typeof Constants.HasTextFileValue
  | typeof Constants.HasArchiveFileValue
  | typeof Constants.HasStillImageFileValue;
