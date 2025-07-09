import { OntologyMetadata, PropertyDefinition, ReadOntology } from '@dasch-swiss/dsp-js';

export interface IKeyValuePairs<T> {
  [key: string]: { value: T[] };
}

export interface IKeyValuePair<T> {
  [key: string]: { value: T };
}

export interface IProjectOntologiesKeyValuePairs {
  [key: string]: {
    ontologiesMetadata: OntologyMetadata[];
    readOntologies: ReadOntology[];
  };
}

export interface OntologyProperties {
  ontology: string;
  properties: PropertyDefinition[];
}

export interface IClassItemsKeyValuePairs {
  [key: string]: {
    ontologyIri: string;
    classItemsCount: number;
  };
}
