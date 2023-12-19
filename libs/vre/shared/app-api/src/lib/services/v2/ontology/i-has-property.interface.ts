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

export interface IHasProperty {
  propertyIndex: string;
  cardinality: Cardinality;
  guiOrder?: number;
  isInherited?: boolean;
}
