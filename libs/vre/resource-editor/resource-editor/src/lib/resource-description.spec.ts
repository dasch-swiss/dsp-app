import { Cardinality, Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { isSegmentClass, showsDescriptionProperty } from './resource-description';

const KNORA_API_V2 = 'http://api.knora.org/ontology/knora-api/v2#';
const HAS_SEGMENT_BOUNDS = `${KNORA_API_V2}hasSegmentBounds`;

const PROJECT_CLASS = 'http://example.org/ontology#Photograph';

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

const makeResource = (type: string, propertyIris: string[]): ReadResource =>
  ({
    type,
    properties: {},
    entityInfo: makeEntityInfo(type, propertyIris),
  }) as unknown as ReadResource;

describe('showsDescriptionProperty', () => {
  it('returns true for a plain project class carrying the hasDescription cardinality', () => {
    const resource = makeResource(PROJECT_CLASS, [Constants.HasDescription]);
    expect(showsDescriptionProperty(resource)).toBe(true);
  });

  it('returns true for a project class without the hasDescription cardinality (project classes always show it)', () => {
    const resource = makeResource(PROJECT_CLASS, []);
    expect(showsDescriptionProperty(resource)).toBe(true);
  });

  it('returns false for knora-api:Region', () => {
    const resource = makeResource(Constants.Region, [Constants.HasDescription]);
    expect(showsDescriptionProperty(resource)).toBe(false);
  });

  it('returns false for knora-api:LinkObj', () => {
    const resource = makeResource(Constants.LinkObj, [Constants.HasDescription]);
    expect(showsDescriptionProperty(resource)).toBe(false);
  });

  it('returns true for AudioSegment', () => {
    const resource = makeResource(`${KNORA_API_V2}AudioSegment`, [Constants.HasDescription, HAS_SEGMENT_BOUNDS]);
    expect(showsDescriptionProperty(resource)).toBe(true);
  });

  it('returns true for VideoSegment', () => {
    const resource = makeResource(`${KNORA_API_V2}VideoSegment`, [Constants.HasDescription, HAS_SEGMENT_BOUNDS]);
    expect(showsDescriptionProperty(resource)).toBe(true);
  });

  it('returns true for a project subclass declaring hasSegmentBounds', () => {
    const resource = makeResource('http://example.org/ontology#CustomSegment', [
      Constants.HasDescription,
      HAS_SEGMENT_BOUNDS,
    ]);
    expect(showsDescriptionProperty(resource)).toBe(true);
  });

  it('returns true and does not throw when entityInfo is missing, since the project-class rule alone decides', () => {
    const resource = { type: PROJECT_CLASS, properties: {} } as unknown as ReadResource;
    expect(() => showsDescriptionProperty(resource)).not.toThrow();
    expect(showsDescriptionProperty(resource)).toBe(true);
  });
});

describe('isSegmentClass', () => {
  it('returns true for AudioSegment and VideoSegment', () => {
    expect(isSegmentClass(makeResource(`${KNORA_API_V2}AudioSegment`, [HAS_SEGMENT_BOUNDS]))).toBe(true);
    expect(isSegmentClass(makeResource(`${KNORA_API_V2}VideoSegment`, [HAS_SEGMENT_BOUNDS]))).toBe(true);
  });

  it('returns true for a project subclass carrying hasSegmentBounds', () => {
    const resource = makeResource('http://example.org/ontology#CustomSegment', [HAS_SEGMENT_BOUNDS]);
    expect(isSegmentClass(resource)).toBe(true);
  });

  it('returns false for a class without hasSegmentBounds', () => {
    expect(isSegmentClass(makeResource(PROJECT_CLASS, [Constants.HasDescription]))).toBe(false);
  });

  it('returns false and does not throw when entityInfo is missing', () => {
    const resource = { type: PROJECT_CLASS, properties: {} } as unknown as ReadResource;
    expect(() => isSegmentClass(resource)).not.toThrow();
    expect(isSegmentClass(resource)).toBe(false);
  });
});
