import { TypeGuard } from '../resources/type-guard';
import { ClassDefinition } from './class-definition';
import { EntityDefinition } from './EntityDefinition';
import { PropertyDefinition } from './property-definition';

/**
 * @category Internal
 */
export abstract class ClassAndPropertyDefinitions {
  abstract properties: { [index: string]: PropertyDefinition };
  abstract classes: { [index: string]: ClassDefinition };

  abstract getAllPropertyDefinitions(): PropertyDefinition[];
  abstract getPropertyDefinitionsByType<T extends PropertyDefinition>(type: TypeGuard.Constructor<T>): T[];

  /**
   * Given a map of entity Iris to entity definitions,
   * returns an array of entity definitions.
   *
   * @param entityDefs Entity definitions to be returned as an array.
   */
  protected getAllEntityDefinitionsAsArray<T extends EntityDefinition>(entityDefs: { [index: string]: T }): T[] {
    const entityIndexes = Object.keys(entityDefs);

    return entityIndexes.map((entityIndex: string) => {
      return entityDefs[entityIndex];
    });
  }

  /**
   * Given an array of entity definitions,
   * returns only the entity definitions matching the given type.
   *
   * @param entityDefs The entity definitions to be filtered.
   * @param type The type of entity definitions to be returned.
   */
  protected getEntityDefinitionsByTypeAsArray<T extends EntityDefinition>(
    entityDefs: EntityDefinition[],
    type: TypeGuard.Constructor<T>
  ): T[] {
    return entityDefs.filter((entityDef: EntityDefinition) => {
      return TypeGuard.typeGuard(entityDef, type);
    }) as T[];
  }
}
