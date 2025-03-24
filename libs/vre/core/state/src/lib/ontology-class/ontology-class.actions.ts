import { ReadResource } from '@dasch-swiss/dsp-js';

export class LoadResourceClassItemsCountAction {
  static readonly type = '[OntologyClass] Load Resource Class Item Count';
  constructor(public resource: ReadResource) {}
}
export class LoadClassItemsCountAction {
  static readonly type = '[OntologyClass] Load Class Item Count';
  constructor(
    public ontologyIri: string,
    public resClassId: string
  ) {}
}

export class ClearOntologyClassAction {
  static readonly type = '[OntologyClass] Clear Ontology Class';
}
