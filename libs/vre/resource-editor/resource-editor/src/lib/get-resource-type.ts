import { Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { getFileValue } from './representations/get-file-value';
import { ResourceType } from './resource-type';

const KNORA_API_V2 = 'http://api.knora.org/ontology/knora-api/v2#';
const VIDEO_SEGMENT_CLASS = `${KNORA_API_V2}VideoSegment`;
const AUDIO_SEGMENT_CLASS = `${KNORA_API_V2}AudioSegment`;

export function getResourceType(resource: ReadResource): ResourceType | null {
  const fileValue = getFileValue(resource);

  if (fileValue) {
    if (resource.properties[Constants.HasStillImageFileValue]) return ResourceType.Image;
    if (resource.properties[Constants.HasMovingImageFileValue]) return ResourceType.Video;
    if (resource.properties[Constants.HasAudioFileValue]) return ResourceType.Audio;
    if (resource.properties[Constants.HasDocumentFileValue]) {
      return fileValue.filename.split('.').pop() === 'pdf' ? ResourceType.Pdf : ResourceType.Document;
    }
    if (resource.properties[Constants.HasArchiveFileValue]) return ResourceType.Archive;
    if (resource.properties[Constants.HasTextFileValue]) return ResourceType.Text;
  }

  // no file value — inspect resource class IRI
  if (resource.type === Constants.Region) return ResourceType.Annotation;
  if (resource.type === VIDEO_SEGMENT_CLASS) return ResourceType.VideoSegment;
  if (resource.type === AUDIO_SEGMENT_CLASS) return ResourceType.AudioSegment;

  // null = needs async compound check to distinguish plain from compound
  return null;
}
