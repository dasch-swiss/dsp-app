import { EntityDefinition } from './EntityDefinition';

/**
 * Represents a property's cardinality.
 *
 * @category Model V2
 */
export enum Cardinality {
  /**
   * Cardinality 1 (required).
   */
  '_1' = 0,

  /**
   * Cardinality 0-1 (optional).
   */
  '_0_1' = 1,

  /**
   * Cardinality 0-n (may have many)
   */
  '_0_n' = 2,

  /**
   * Cardinality 1-n (at least one).
   */
  '_1_n' = 3,
}

/**
 * Represents a property defined on a resource class.
 * Contains only the property's IRI, not the definition itself.
 *
 * @category Model V2
 */
export interface IHasProperty {
  /**
   * Iri of the property.
   */
  propertyIndex: string;

  /**
   * Cardinality for the property.
   */
  cardinality: Cardinality;

  /**
   * GUI order, if any.
   */
  guiOrder?: number;

  /**
   * Indicates if the property has been inherited from a super class.
   * Only present when reading from Knora.
   */
  isInherited?: boolean;
}

/**
 * Represents a resource class.
 *
 * @category Internal
 */
export abstract class ClassDefinition extends EntityDefinition {
  /**
   * Subclass of relations to super classes.
   */
  abstract subClassOf: string[];

  /**
   * Properties defined on the resource class.
   */
  abstract propertiesList: IHasProperty[];
}
