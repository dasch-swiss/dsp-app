import { ClassDefinition, IHasProperty, OntologyMetadata, PropertyDefinition, ReadOntology } from '@dasch-swiss/dsp-js';
import { PropertyInfoObject } from '@dasch-swiss/vre/shared/app-helper-services';

export interface IKeyValuePairs<T> {
  [key: string]: { value: T[] };
}

export interface IProjectOntologiesKeyValuePairs {
  [key: string]: {
    ontologiesMetadata: OntologyMetadata[];
    readOntologies: ReadOntology[];
  };
}

/**
 * contains the information about the assignment of a property to a class
 * */
export interface PropertyAssignment {
  resClass: ClassDefinition;
  property: PropertyInfoObject;
}

export interface OntologyProperties {
  ontology: string;
  properties: PropertyDefinition[];
}

export interface PropToDisplay extends IHasProperty {
  propDef?: PropertyDefinition;
}

export interface PropToAdd {
  ontologyId: string;
  ontologyLabel: string;
  properties: PropertyInfoObject[];
}

export interface IClassItemsKeyValuePairs {
  [key: string]: {
    ontologyIri: string;
    classItemsCount: number;
  };
}
