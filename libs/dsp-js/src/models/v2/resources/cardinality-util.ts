import { Cardinality, IHasProperty } from '../../../models/v2/ontologies/class-definition';
import { ResourceClassDefinition } from '../ontologies/resource-class-definition';

/**
 * Utility methods to facilitate the handling of a property's cardinality.
 *
 * @category Model V2
 */
export namespace CardinalityUtil {
  /**
   * Returns the cardinality for a property from a `ResourceClassDefinition`.
   *
   * @param propertyIri Iri of the property.
   * @param entityInfo class information.
   */
  const getCardinalityForProp = (propertyIri: string, entityInfo: ResourceClassDefinition): Cardinality => {
    const cardinalityForProp = entityInfo.propertiesList.filter(hasProp => hasProp.propertyIndex === propertyIri);

    if (cardinalityForProp.length !== 1) {
      throw new Error('No cardinality found for ' + propertyIri);
    }

    return cardinalityForProp[0].cardinality;
  };

  export const cardinalities: Map<Cardinality, string> = new Map<Cardinality, string>([
    [Cardinality._0_1, '0-1'],
    [Cardinality._0_n, '0-n'],
    [Cardinality._1, '1'],
    [Cardinality._1_n, '1-n'],
  ]);

  /**
   * Determines if a value can be created for a given property.
   *
   * @param propertyIri Iri of the property.
   * @param numberOfInstances number of existing values of the property in question.
   * @param entityInfo class information.
   */
  export const createValueForPropertyAllowed = (
    propertyIri: string,
    numberOfInstances: number,
    entityInfo: ResourceClassDefinition
  ): boolean => {
    const cardinality = getCardinalityForProp(propertyIri, entityInfo);

    if (numberOfInstances > 0) {
      // at least one existing value for property
      // 1-n and 0-n allow for the creation of additional values
      return cardinality === Cardinality._1_n || cardinality === Cardinality._0_n;
    } else {
      // no existing value for property
      // 0-1 and 0-n allow for the creation of a value
      return cardinality === Cardinality._0_1 || cardinality === Cardinality._0_n;
    }
  };

  /**
   * Determines if a value can be deleted for a given property.
   *
   * @param propertyIri Iri of the property.
   * @param numberOfInstances number of existing values of the property in question.
   * @param entityInfo class information.
   */
  export const deleteValueForPropertyAllowed = (
    propertyIri: string,
    numberOfInstances: number,
    entityInfo: ResourceClassDefinition
  ): boolean => {
    const cardinality = getCardinalityForProp(propertyIri, entityInfo);

    if (numberOfInstances > 1) {
      // more than one existing value
      // 1-n allows for the deletion of a value
      // if there is at least one remaining value
      return cardinality === Cardinality._1_n || cardinality === Cardinality._0_n;
    } else {
      // single value
      // 0-1 and 0-n allow for deletion of a single value
      return cardinality === Cardinality._0_1 || cardinality === Cardinality._0_n;
    }
  };
}
