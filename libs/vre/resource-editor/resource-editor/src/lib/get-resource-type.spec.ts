import { Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { getResourceType } from './get-resource-type';
import { ResourceType } from './resource-type';

const KNORA_API_V2 = 'http://api.knora.org/ontology/knora-api/v2#';

// Minimal ReadResource factory: sets properties and type
const makeResource = (propertyKey: string, filename = 'file.jpg', type = '', valueType = ''): ReadResource =>
  ({
    type,
    properties: {
      [propertyKey]: [{ filename, type: valueType }],
    },
  }) as unknown as ReadResource;

const makeResourceNoFile = (type = ''): ReadResource =>
  ({
    type,
    properties: {},
  }) as unknown as ReadResource;

describe('getResourceType', () => {
  describe('when the resource has a still image file value', () => {
    it('returns Image', () => {
      const resource = makeResource(Constants.HasStillImageFileValue, 'image.jp2', '', Constants.StillImageFileValue);
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

    it('returns Segment for knora-api:VideoSegment resources', () => {
      const resource = makeResourceNoFile(`${KNORA_API_V2}VideoSegment`);
      expect(getResourceType(resource)).toBe(ResourceType.Segment);
    });

    it('returns Segment for knora-api:AudioSegment resources', () => {
      const resource = makeResourceNoFile(`${KNORA_API_V2}AudioSegment`);
      expect(getResourceType(resource)).toBe(ResourceType.Segment);
    });

    it('returns null for plain objects (compound check needed)', () => {
      const resource = makeResourceNoFile('http://example.org/ontology#SomeClass');
      expect(getResourceType(resource)).toBeNull();
    });
  });
});
