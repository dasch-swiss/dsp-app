import { Cardinality, Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { isSegmentClass, showsDescriptionInHeader } from './resource-description';

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

describe('showsDescriptionInHeader', () => {
  it('returns true for a project class carrying the hasDescription cardinality', () => {
    expect(showsDescriptionInHeader(makeResource(PROJECT_CLASS, [Constants.HasDescription]))).toBe(true);
  });

  it('returns false for a project class without the cardinality (a dsp-api older than knora-base v58)', () => {
    expect(showsDescriptionInHeader(makeResource(PROJECT_CLASS, []))).toBe(false);
  });

  it.each([Constants.Region, Constants.LinkObj])('returns false for %s', type => {
    expect(showsDescriptionInHeader(makeResource(type, [Constants.HasDescription]))).toBe(false);
  });

  it.each(['AudioSegment', 'VideoSegment'])('returns false for %s, which keeps its property row', segment => {
    const resource = makeResource(`${KNORA_API_V2}${segment}`, [Constants.HasDescription, HAS_SEGMENT_BOUNDS]);
    expect(showsDescriptionInHeader(resource)).toBe(false);
  });

  it('returns false for a project subclass declaring hasSegmentBounds', () => {
    const resource = makeResource('http://example.org/ontology#CustomSegment', [
      Constants.HasDescription,
      HAS_SEGMENT_BOUNDS,
    ]);
    expect(showsDescriptionInHeader(resource)).toBe(false);
  });

  it('returns false and does not throw when entityInfo is missing', () => {
    const resource = { type: PROJECT_CLASS, properties: {} } as unknown as ReadResource;
    expect(() => showsDescriptionInHeader(resource)).not.toThrow();
    expect(showsDescriptionInHeader(resource)).toBe(false);
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
