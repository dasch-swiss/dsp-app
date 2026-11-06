import { RepresentationClass } from '@dasch-swiss/vre/3rd-party-services/open-api';

/** The Material icon for the kind of file a resource class carries. */
export function representationIcon(representationClass: RepresentationClass | undefined): string {
  switch (representationClass) {
    case 'ArchiveRepresentation':
      return 'folder_zip';
    case 'AudioRepresentation':
      return 'audio_file';
    case 'DocumentRepresentation':
      return 'description';
    case 'MovingImageRepresentation':
      return 'video_file';
    case 'StillImageRepresentation':
      return 'image';
    case 'TextRepresentation':
      return 'text_snippet';
    case 'WithoutRepresentation':
    default: // resource does not have a file representation
      return 'insert_drive_file';
  }
}
