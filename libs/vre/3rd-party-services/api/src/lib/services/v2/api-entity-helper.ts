import { EntityDefinition } from '@dasch-swiss/dsp-js/src/models/v2/ontologies/EntityDefinition';

export const getAllEntityDefinitionsAsArray = <T extends EntityDefinition>(entityDefs: { [index: string]: T }): T[] => {
  const entityIndexes = Object.keys(entityDefs);

  return entityIndexes.map((entityIndex: string) => entityDefs[entityIndex]);
};
