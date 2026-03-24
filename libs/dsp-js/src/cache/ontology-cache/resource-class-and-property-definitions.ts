import { ClassAndPropertyDefinitions } from '../../models/v2/ontologies/ClassAndPropertyDefinitions';
import { PropertyDefinition } from '../../models/v2/ontologies/property-definition';
import { TypeGuard } from '../../models/v2/resources/type-guard';
import { ResourceClassDefinitionWithPropertyDefinition } from './resource-class-definition-with-property-definition';

/**
 * Represents resource class definitions
 * and property definitions the resource classes have cardinalities for.
 *
 * @category Model V2
 */
export class ResourceClassAndPropertyDefinitions extends ClassAndPropertyDefinitions {
  /**
   * Resource class definitions and their cardinalities.
   */
  classes: { [index: string]: ResourceClassDefinitionWithPropertyDefinition };

  /**
   * Property definitions referred to in cardinalities.
   */
  properties: { [index: string]: PropertyDefinition };

  constructor(
    resClassDefs: { [index: string]: ResourceClassDefinitionWithPropertyDefinition },
    propDefs: { [index: string]: PropertyDefinition }
  ) {
    super();
    this.classes = resClassDefs;
    this.properties = propDefs;
  }

  /**
   * Gets all property definitions from the resource's entity info.
   */
  getAllPropertyDefinitions(): PropertyDefinition[] {
    return this.getAllEntityDefinitionsAsArray(this.properties);
  }

  /**
   * Gets property definitions restricted by type from the resource's entity info.
   *
   * @param type restriction to a certain property definition type.
   */
  getPropertyDefinitionsByType<T extends PropertyDefinition>(type: TypeGuard.Constructor<T>): T[] {
    return this.getEntityDefinitionsByTypeAsArray(this.getAllPropertyDefinitions(), type);
  }
}
