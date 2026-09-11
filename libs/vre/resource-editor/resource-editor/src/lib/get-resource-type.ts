import { Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { getFileValue } from './representation/get-file-value';
import { ResourceType } from './resource-type';

const KNORA_API_V2 = 'http://api.knora.org/ontology/knora-api/v2#';
const VIDEO_SEGMENT_CLASS = `${KNORA_API_V2}VideoSegment`;
const AUDIO_SEGMENT_CLASS = `${KNORA_API_V2}AudioSegment`;

/**
 * File-value property IRI -> the resource type of the class declaring it.
 *
 * No resource class declares more than one file-value cardinality, so this mapping is
 * unambiguous. dsp-api flattens inherited cardinalities into every class, so a class several
 * levels below its `knora-api:*Representation` superclass still declares the property directly.
 */
const RESOURCE_TYPE_BY_FILE_PROPERTY: ReadonlyArray<[string, ResourceType]> = [
  [Constants.HasStillImageFileValue, ResourceType.Image],
  [Constants.HasMovingImageFileValue, ResourceType.Video],
  [Constants.HasAudioFileValue, ResourceType.Audio],
  [Constants.HasDocumentFileValue, ResourceType.Document],
  [Constants.HasArchiveFileValue, ResourceType.Archive],
  [Constants.HasTextFileValue, ResourceType.Text],
];

/**
 * The representation type the resource's class declares, or `null` for a non-representation.
 *
 * This is the source of truth for *what kind of thing the resource is*: the class definition is
 * stable schema, whereas the file value is per-request data that permissions can withhold
 * (DEV-7072). Classifying from the class means a restricted representation still reaches its
 * media wrapper, which renders the no-access notice.
 */
function getDeclaredRepresentationType(resource: ReadResource): ResourceType | null {
  // `entityInfo` is `!`-typed but can be absent: OntologyCache returns empty definitions for an
  // unknown class (dsp-js logs 'unsupported type' in that case) and bare test doubles omit it.
  const classDefinition = resource.entityInfo?.classes?.[resource.type];
  if (!classDefinition) {
    return null;
  }

  const declaredProperties = new Set(classDefinition.propertiesList?.map(property => property.propertyIndex) ?? []);

  return RESOURCE_TYPE_BY_FILE_PROPERTY.find(([propertyIri]) => declaredProperties.has(propertyIri))?.[1] ?? null;
}

/**
 * Refines the declared type where the class alone is not specific enough.
 *
 * `DocumentRepresentation` covers PDFs and office documents alike, and only the filename tells
 * them apart — so this is the one distinction that needs the file value. When the file value is
 * withheld the declared `Document` stands, and both wrappers render the same restricted notice.
 */
function refineWithFileValue(declaredType: ResourceType, resource: ReadResource): ResourceType {
  if (declaredType !== ResourceType.Document) {
    return declaredType;
  }

  const fileValue = getFileValue(resource);
  const isPdf = fileValue?.filename.split('.').pop()?.toLowerCase() === 'pdf';

  return isPdf ? ResourceType.Pdf : ResourceType.Document;
}

export function getResourceType(resource: ReadResource): ResourceType | null {
  // classes identified by IRI alone. Checked before the cardinality lookup so that a class whose
  // identity is fixed by the IRI can never be reclassified as a representation: a region or
  // segment annotates media (via a link property) rather than being a representation of it.
  if (resource.type === Constants.Region) return ResourceType.Annotation;
  if (resource.type === VIDEO_SEGMENT_CLASS) return ResourceType.VideoSegment;
  if (resource.type === AUDIO_SEGMENT_CLASS) return ResourceType.AudioSegment;

  const declaredType = getDeclaredRepresentationType(resource);
  if (declaredType !== null) return refineWithFileValue(declaredType, resource);

  // null = needs async compound check to distinguish plain from compound
  return null;
}
