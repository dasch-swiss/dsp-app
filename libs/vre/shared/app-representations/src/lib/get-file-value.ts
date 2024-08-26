import {
  Constants,
  ReadArchiveFileValue,
  ReadAudioFileValue,
  ReadDocumentFileValue,
  ReadMovingImageFileValue,
  ReadStillImageFileValue,
  ReadStillImageExternalFileValue,
  ReadTextFileValue,
} from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';

export function getFileValue(resource: DspResource) {
  if (resource.res.properties[Constants.HasStillImageFileValue]) {
    if (resource.res.properties[Constants.HasStillImageFileValue][0].type === Constants.StillImageFileValue) {
      return resource.res.properties[Constants.HasStillImageFileValue][0] as ReadStillImageFileValue;
    } else if (
      resource.res.properties[Constants.HasStillImageFileValue][0].type === Constants.StillImageExternalFileValue
    ) {
      return resource.res.properties[Constants.HasStillImageFileValue][0] as ReadStillImageExternalFileValue;
    }
  } else if (resource.res.properties[Constants.HasDocumentFileValue]) {
    return resource.res.properties[Constants.HasDocumentFileValue][0] as ReadDocumentFileValue;
  } else if (resource.res.properties[Constants.HasAudioFileValue]) {
    return resource.res.properties[Constants.HasAudioFileValue][0] as ReadAudioFileValue;
  } else if (resource.res.properties[Constants.HasMovingImageFileValue]) {
    return resource.res.properties[Constants.HasMovingImageFileValue][0] as ReadMovingImageFileValue;
  } else if (resource.res.properties[Constants.HasArchiveFileValue]) {
    return resource.res.properties[Constants.HasArchiveFileValue][0] as ReadArchiveFileValue;
  } else if (resource.res.properties[Constants.HasTextFileValue]) {
    return resource.res.properties[Constants.HasTextFileValue][0] as ReadTextFileValue;
  }

  return null; // when it is an object without representation
}
