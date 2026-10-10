import { Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { GenerateProperty } from './generateProperty';

const KNORA_API_V2 = 'http://api.knora.org/ontology/knora-api/v2#';

const makeResource = (type: string): ReadResource => {
  const propertyDefinition = (id: string) => ({
    id,
    objectType: Constants.TextValue,
    isLinkProperty: false,
    subPropertyOf: [],
  });
  return {
    type,
    entityInfo: {
      classes: {
        [type]: {
          getResourcePropertiesList: () =>
            [Constants.HasComment, Constants.HasDescription].map(id => ({
              propertyIndex: id,
              propertyDefinition: propertyDefinition(id),
            })),
        },
      },
    },
    getValues: () => [],
  } as unknown as ReadResource;
};

const propertyIds = (resource: ReadResource) => GenerateProperty.commonProperty(resource).map(p => p.propDef.id);

describe('GenerateProperty.commonProperty', () => {
  it('drops hasDescription on a project resource, which shows it in the header instead', () => {
    expect(propertyIds(makeResource('http://example.org/ontology#Photograph'))).toEqual([Constants.HasComment]);
  });

  it.each(['AudioSegment', 'VideoSegment'])('keeps hasDescription on a %s', segment => {
    expect(propertyIds(makeResource(`${KNORA_API_V2}${segment}`))).toContain(Constants.HasDescription);
  });
});
