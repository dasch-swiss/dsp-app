import { IHasProperty } from '../../models/v2/ontologies/class-definition';
import { PropertyDefinition } from '../../models/v2/ontologies/property-definition';
import { ResourceClassDefinitionWithAllLanguages } from '../../models/v2/ontologies/resource-class-definition';
import { ResourcePropertyDefinition } from '../../models/v2/ontologies/resource-property-definition';
import { SystemPropertyDefinition } from '../../models/v2/ontologies/system-property-definition';

/**
 * Represents a resource class definition containing all property definitions it has cardinalities for.
 *
 * @category Model V2
 */
export class ResourceClassDefinitionWithPropertyDefinition extends ResourceClassDefinitionWithAllLanguages {
  override propertiesList: IHasPropertyWithPropertyDefinition[] = [];

  /**
   * Create an instance from a given `ResourceClassDefinitionWithAllLanguages`.
   *
   * @param resClassDef instance of `ResourceClassDefinitionWithAllLanguages`.
   * @param propertyDefinitions object containing all `PropertyDefinition`
   *                            the resource class definition has cardinalities for.
   */
  constructor(
    resClassDef: ResourceClassDefinitionWithAllLanguages,
    propertyDefinitions: { [index: string]: PropertyDefinition }
  ) {
    super();

    this.id = resClassDef.id;
    this.label = resClassDef.label;
    this.labels = resClassDef.labels;
    this.comment = resClassDef.comment;
    this.comments = resClassDef.comments;
    this.subClassOf = resClassDef.subClassOf;

    // add property definition to properties list's items
    this.propertiesList = resClassDef.propertiesList.map((prop: IHasProperty) => {
      if (!propertyDefinitions.hasOwnProperty(prop.propertyIndex)) {
        throw Error(`Expected key ${prop.propertyIndex} in property definitions.`);
      }

      const propInfo: IHasPropertyWithPropertyDefinition = {
        propertyIndex: prop.propertyIndex,
        cardinality: prop.cardinality,
        guiOrder: prop.guiOrder,
        isInherited: prop.isInherited,
        propertyDefinition: propertyDefinitions[prop.propertyIndex],
      };
      return propInfo;
    });
  }

  /**
   * Gets the resource properties from properties list.
   */
  getResourcePropertiesList(): IHasPropertyWithPropertyDefinition[] {
    return this.propertiesList.filter(prop => {
      return prop.propertyDefinition instanceof ResourcePropertyDefinition;
    });
  }

  /**
   * Gets the system properties from properties list.
   */
  getSystemPropertiesList(): IHasPropertyWithPropertyDefinition[] {
    return this.propertiesList.filter(prop => {
      return prop.propertyDefinition instanceof SystemPropertyDefinition;
    });
  }
}

/**
 * Represents a property defined on a resource class
 * including the property definition.
 *
 * @category Model V2
 */
export interface IHasPropertyWithPropertyDefinition extends IHasProperty {
  propertyDefinition: PropertyDefinition;
}
