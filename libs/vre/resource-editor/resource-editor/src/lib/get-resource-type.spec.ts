import { Cardinality, Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { getResourceType } from './get-resource-type';
import { ResourceType } from './resource-type';

const KNORA_API_V2 = 'http://api.knora.org/ontology/knora-api/v2#';

const DEFAULT_CLASS = 'http://example.org/ontology#Representation';

/**
 * Builds the `entityInfo` a real `ReadResource` always carries.
 *
 * `ResourcesConversionUtil.createReadResource()` assigns `resource.entityInfo` unconditionally
 * from the ontology cache for every resource it deserializes, so a resource that holds a file
 * value in `properties` always also declares that property's cardinality on its class. The two
 * are not independent: `properties` can only be populated for a property the class declares.
 *
 * Fixtures that set `properties` without `entityInfo` describe a resource the API cannot return.
 */
const makeEntityInfo = (resourceType: string, propertyIris: string[]) =>
  ({
    classes: {
      [resourceType]: {
        propertiesList: propertyIris.map(propertyIndex => ({
          propertyIndex,
          cardinality: Cardinality._0_1,
          isInherited: false,
        })),
      },
    },
    properties: {},
  }) as unknown as ReadResource['entityInfo'];

// Minimal ReadResource factory: sets properties and type, plus the class definition
// declaring the file property's cardinality — as dsp-api always does.
const makeResource = (propertyKey: string, filename = 'file.jpg', type = DEFAULT_CLASS, valueType = ''): ReadResource =>
  ({
    type,
    properties: {
      [propertyKey]: [{ filename, type: valueType }],
    },
    entityInfo: makeEntityInfo(type, [propertyKey]),
  }) as unknown as ReadResource;

// A resource with no file value: its class declares no file-value cardinality either.
const makeResourceNoFile = (type = DEFAULT_CLASS): ReadResource =>
  ({
    type,
    properties: {},
    entityInfo: makeEntityInfo(type, []),
  }) as unknown as ReadResource;

/**
 * A representation whose file value is withheld (DEV-7072).
 *
 * dsp-api drops values the user may not read and removes the property key entirely when none
 * remain, so `properties` is empty — while the class definition still declares the cardinality.
 * The resource itself stays viewable (`userHasPermission` V/RV/CR).
 */
const makeResourceWithheldFile = (filePropertyIri: string, type = DEFAULT_CLASS): ReadResource =>
  ({
    type,
    properties: {},
    userHasPermission: 'V',
    entityInfo: makeEntityInfo(type, [filePropertyIri]),
  }) as unknown as ReadResource;

describe('getResourceType', () => {
  describe('when the resource has a still image file value', () => {
    it('returns Image', () => {
      const resource = makeResource(
        Constants.HasStillImageFileValue,
        'image.jp2',
        DEFAULT_CLASS,
        Constants.StillImageFileValue
      );
      expect(getResourceType(resource)).toBe(ResourceType.Image);
    });
  });

  describe('when the resource has a moving image file value', () => {
    it('returns Video', () => {
      const resource = makeResource(Constants.HasMovingImageFileValue);
      expect(getResourceType(resource)).toBe(ResourceType.Video);
    });
  });

  describe('when the resource has an audio file value', () => {
    it('returns Audio', () => {
      const resource = makeResource(Constants.HasAudioFileValue);
      expect(getResourceType(resource)).toBe(ResourceType.Audio);
    });
  });

  describe('when the resource has a document file value', () => {
    it('returns Pdf for .pdf files', () => {
      const resource = makeResource(Constants.HasDocumentFileValue, 'report.pdf');
      expect(getResourceType(resource)).toBe(ResourceType.Pdf);
    });

    it('returns Document for non-pdf files', () => {
      const resource = makeResource(Constants.HasDocumentFileValue, 'report.docx');
      expect(getResourceType(resource)).toBe(ResourceType.Document);
    });
  });

  describe('when the resource has an archive file value', () => {
    it('returns Archive', () => {
      const resource = makeResource(Constants.HasArchiveFileValue, 'data.zip');
      expect(getResourceType(resource)).toBe(ResourceType.Archive);
    });
  });

  describe('when the resource has a text file value', () => {
    it('returns Text', () => {
      const resource = makeResource(Constants.HasTextFileValue, 'note.txt');
      expect(getResourceType(resource)).toBe(ResourceType.Text);
    });
  });

  describe('when the resource has no file value', () => {
    it('returns Annotation for knora-api:Region resources', () => {
      const resource = makeResourceNoFile(Constants.Region);
      expect(getResourceType(resource)).toBe(ResourceType.Annotation);
    });

    it('returns VideoSegment for knora-api:VideoSegment resources', () => {
      const resource = makeResourceNoFile(`${KNORA_API_V2}VideoSegment`);
      expect(getResourceType(resource)).toBe(ResourceType.VideoSegment);
    });

    it('returns AudioSegment for knora-api:AudioSegment resources', () => {
      const resource = makeResourceNoFile(`${KNORA_API_V2}AudioSegment`);
      expect(getResourceType(resource)).toBe(ResourceType.AudioSegment);
    });

    it('returns null for plain objects (compound check needed)', () => {
      const resource = makeResourceNoFile('http://example.org/ontology#SomeClass');
      expect(getResourceType(resource)).toBeNull();
    });
  });
  describe('when the file value is withheld but the class declares one (DEV-7072)', () => {
    it.each([
      [Constants.HasStillImageFileValue, ResourceType.Image],
      [Constants.HasMovingImageFileValue, ResourceType.Video],
      [Constants.HasAudioFileValue, ResourceType.Audio],
      [Constants.HasArchiveFileValue, ResourceType.Archive],
      [Constants.HasTextFileValue, ResourceType.Text],
    ])('routes %s to its media wrapper instead of the plain view', (filePropertyIri, expected) => {
      expect(getResourceType(makeResourceWithheldFile(filePropertyIri))).toBe(expected);
    });

    it('returns Document for a withheld document file value, as the filename is unavailable', () => {
      // Pdf cannot be distinguished without the filename; both wrappers show the same notice.
      expect(getResourceType(makeResourceWithheldFile(Constants.HasDocumentFileValue))).toBe(ResourceType.Document);
    });

    it('classifies a class several levels below its representation superclass', () => {
      // e.g. beol:page -> beol:documentImage -> knora-api:StillImageRepresentation. dsp-api
      // flattens inherited cardinalities, so the file property sits on the class itself.
      const resource = makeResourceWithheldFile(Constants.HasStillImageFileValue, 'http://example.org/ontology#Page');
      expect(getResourceType(resource)).toBe(ResourceType.Image);
    });

    it('returns null for a class declaring no file-value cardinality', () => {
      const resource = makeResourceWithheldFile('http://example.org/ontology#hasTitle');
      expect(getResourceType(resource)).toBeNull();
    });

    it('prefers the segment class IRI over a declared file cardinality', () => {
      const resource = makeResourceWithheldFile(Constants.HasMovingImageFileValue, `${KNORA_API_V2}VideoSegment`);
      expect(getResourceType(resource)).toBe(ResourceType.VideoSegment);
    });

    it('returns null when entityInfo is absent, falling back to the compound check', () => {
      // dsp-js logs 'unsupported type' for an unknown class; not a shape the API returns normally.
      const resource = { type: DEFAULT_CLASS, properties: {} } as unknown as ReadResource;
      expect(getResourceType(resource)).toBeNull();
    });
  });
});
