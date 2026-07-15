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
  ReadStillImageVectorFileValue,
  ReadTextFileValue,
} from '@dasch-swiss/dsp-js';

export function getFileValue(resource: ReadResource): ReadFileValue | null {
  const _fv = _resolveFileValue(resource);
  // TEMP DEBUG (DEV-6568): extracted file value that feeds isPlaceholderFileValue().
  // eslint-disable-next-line no-console
  console.warn(
    `[DEV-6568] (7) getFileValue resourceId=${JSON.stringify(resource?.id)} -> type=${JSON.stringify(
      _fv?.type
    )} filename=${JSON.stringify(_fv?.filename)} fileUrl=${JSON.stringify(_fv?.fileUrl)}`
  );
  return _fv;
}

function _resolveFileValue(resource: ReadResource): ReadFileValue | null {
  if (resource.properties[Constants.HasStillImageFileValue]) {
    if (resource.properties[Constants.HasStillImageFileValue][0].type === Constants.StillImageFileValue) {
      return resource.properties[Constants.HasStillImageFileValue][0] as ReadStillImageFileValue;
    } else if (
      resource.properties[Constants.HasStillImageFileValue][0].type === Constants.StillImageExternalFileValue
    ) {
      return resource.properties[Constants.HasStillImageFileValue][0] as ReadStillImageExternalFileValue;
    } else if (resource.properties[Constants.HasStillImageFileValue][0].type === Constants.StillImageVectorFileValue) {
      return resource.properties[Constants.HasStillImageFileValue][0] as ReadStillImageVectorFileValue;
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
  return null; // is object without representation
}
