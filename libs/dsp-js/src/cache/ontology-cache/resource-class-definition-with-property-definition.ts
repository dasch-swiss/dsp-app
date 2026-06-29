import { IHasProperty } from '../../models/v2/ontologies/class-definition';
import { PropertyDefinition } from '../../models/v2/ontologies/property-definition';
import {
  ResourceClassDefinition,
  ResourceClassDefinitionWithAllLanguages,
} from '../../models/v2/ontologies/resource-class-definition';
import { ResourcePropertyDefinition } from '../../models/v2/ontologies/resource-property-definition';
import { SystemPropertyDefinition } from '../../models/v2/ontologies/system-property-definition';

/**
 * Represents a resource class definition containing all property definitions it has cardinalities for.
 *
 * Extends `ResourceClassDefinitionWithAllLanguages` so consumers can read the
 * `.labels` / `.comments` arrays in addition to the single-language `.label` / `.comment`.
 * In production the cache fetches ontologies with `allLanguages=true`, so those arrays
 * are populated. Test fixtures may pass the base `ResourceClassDefinition` shape; in
 * that case `.labels` / `.comments` fall back to empty arrays.
 *
 * @category Model V2
 */
export class ResourceClassDefinitionWithPropertyDefinition extends ResourceClassDefinitionWithAllLanguages {
  override propertiesList: IHasPropertyWithPropertyDefinition[] = [];

  /**
   * Create an instance from a given `ResourceClassDefinition` (or `ResourceClassDefinitionWithAllLanguages`).
   *
   * @param resClassDef instance of `ResourceClassDefinition`. If it is actually a
   *                    `ResourceClassDefinitionWithAllLanguages` at runtime, its
   *                    `.labels` / `.comments` arrays will be copied over.
   * @param propertyDefinitions object containing all `PropertyDefinition`
   *                            the resource class definition has cardinalities for.
   */
  constructor(resClassDef: ResourceClassDefinition, propertyDefinitions: { [index: string]: PropertyDefinition }) {
    super();

    this.id = resClassDef.id;
    this.label = resClassDef.label;
    this.comment = resClassDef.comment;
    this.subClassOf = resClassDef.subClassOf;

    const withAllLanguages = resClassDef as ResourceClassDefinitionWithAllLanguages;
    this.labels = withAllLanguages.labels ?? [];
    this.comments = withAllLanguages.comments ?? [];

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
