import {
  Constants,
  CreateArchiveFileValue,
  CreateAudioFileValue,
  CreateDocumentFileValue,
  CreateFileValue,
  CreateMovingImageFileValue,
  CreateStillImageFileValue,
  CreateTextFileValue,
  UpdateArchiveFileValue,
  UpdateAudioFileValue,
  UpdateDocumentFileValue,
  UpdateMovingImageFileValue,
  UpdateStillImageFileValue,
  UpdateTextFileValue,
} from '@dasch-swiss/dsp-js';

interface FileValueParameters {
  create: () => CreateFileValue;
  update: () => UpdateStillImageFileValue;
}

export const fileValueMapping = new Map<string, FileValueParameters>([
  [
    Constants.HasStillImageFileValue,
    {
      create: () => {
        return new CreateStillImageFileValue();
      },
      update: () => {
        return new UpdateStillImageFileValue();
      },
    },
  ],
  [
    Constants.HasAudioFileValue,
    {
      create: () => {
        return new CreateAudioFileValue();
      },
      update: () => {
        return new UpdateAudioFileValue();
      },
    },
  ],
  [
    Constants.HasMovingImageFileValue,
    {
      create: () => {
        return new CreateMovingImageFileValue();
      },
      update: () => {
        return new UpdateMovingImageFileValue();
      },
    },
  ],
  [
    Constants.HasDocumentFileValue,
    {
      create: () => {
        return new CreateDocumentFileValue();
      },
      update: () => {
        return new UpdateDocumentFileValue();
      },
    },
  ],
  [
    Constants.HasTextFileValue,
    {
      create: () => {
        return new CreateTextFileValue();
      },
      update: () => {
        return new UpdateTextFileValue();
      },
    },
  ],
  [
    Constants.HasArchiveFileValue,
    {
      create: () => {
        return new CreateArchiveFileValue();
      },
      update: () => {
        return new UpdateArchiveFileValue();
      },
    },
  ],
]);
