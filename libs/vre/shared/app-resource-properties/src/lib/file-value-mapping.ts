import {
  Constants,
  CreateArchiveFileValue,
  CreateAudioFileValue,
  CreateDocumentFileValue,
  CreateFileValue,
  CreateMovingImageFileValue,
  CreateStillImageFileValue,
  CreateTextFileValue,
} from '@dasch-swiss/dsp-js';
import { FileRepresentationType } from './file-representation.type';

export const fileValueMapping = new Map<
  FileRepresentationType,
  {
    fileTypes: string[];
    UploadClass: new () => CreateFileValue;
  }
>([
  [
    Constants.HasStillImageFileValue as FileRepresentationType,
    {
      fileTypes: ['jp2', 'jpg', 'jpeg', 'png', 'tif', 'tiff'],
      UploadClass: CreateStillImageFileValue,
    },
  ],
  [
    Constants.HasMovingImageFileValue as FileRepresentationType,
    {
      fileTypes: ['mp4'],
      UploadClass: CreateMovingImageFileValue,
    },
  ],
  [
    Constants.HasAudioFileValue as FileRepresentationType,
    {
      fileTypes: ['mp3', 'wav'],
      UploadClass: CreateAudioFileValue,
    },
  ],
  [
    Constants.HasDocumentFileValue as FileRepresentationType,
    {
      fileTypes: ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx'],
      UploadClass: CreateDocumentFileValue,
    },
  ],
  [
    Constants.HasTextFileValue as FileRepresentationType,
    {
      fileTypes: ['csv', 'odd', 'rng', 'txt', 'xml', 'xsd', 'xsl'],
      UploadClass: CreateTextFileValue,
    },
  ],
  [
    Constants.HasArchiveFileValue as FileRepresentationType,
    {
      fileTypes: ['7z', 'gz', 'gzip', 'tar', 'tgz', 'z', 'zip'],
      UploadClass: CreateArchiveFileValue,
    },
  ],
]);
