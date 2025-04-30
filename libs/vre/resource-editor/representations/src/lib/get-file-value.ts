import {
  Constants,
  ReadArchiveFileValue,
  ReadAudioFileValue,
  ReadDocumentFileValue,
  ReadFileValue,
  ReadMovingImageFileValue,
  ReadResource,
  ReadStillImageExternalFileValue,
  ReadStillImageFileValue,
  ReadTextFileValue,
} from '@dasch-swiss/dsp-js';

export function getFileValue(resource: ReadResource): ReadFileValue {
  if (resource.properties[Constants.HasStillImageFileValue]) {
    if (resource.properties[Constants.HasStillImageFileValue][0].type === Constants.StillImageFileValue) {
      return resource.properties[Constants.HasStillImageFileValue][0] as ReadStillImageFileValue;
    } else if (
      resource.properties[Constants.HasStillImageFileValue][0].type === Constants.StillImageExternalFileValue
    ) {
      return resource.properties[Constants.HasStillImageFileValue][0] as ReadStillImageExternalFileValue;
    }
  } else if (resource.properties[Constants.HasDocumentFileValue]) {
    return resource.properties[Constants.HasDocumentFileValue][0] as ReadDocumentFileValue;
  } else if (resource.properties[Constants.HasAudioFileValue]) {
    return resource.properties[Constants.HasAudioFileValue][0] as ReadAudioFileValue;
  } else if (resource.properties[Constants.HasMovingImageFileValue]) {
    return resource.properties[Constants.HasMovingImageFileValue][0] as ReadMovingImageFileValue;
  } else if (resource.properties[Constants.HasArchiveFileValue]) {
    return resource.properties[Constants.HasArchiveFileValue][0] as ReadArchiveFileValue;
  } else if (resource.properties[Constants.HasTextFileValue]) {
    return resource.properties[Constants.HasTextFileValue][0] as ReadTextFileValue;
  }

  return null; // when it is an object without representation
}
