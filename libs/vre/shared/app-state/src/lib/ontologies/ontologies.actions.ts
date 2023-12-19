import {
  ClassDefinition,
  ReadOntology,
  UpdateOntologyMetadata,
} from '@dasch-swiss/dsp-js';
import { DefaultClass } from '@dasch-swiss/vre/shared/app-helper-services';
import { PropToDisplay } from '../model-interfaces';

export class LoadProjectOntologiesAction {
  static readonly type = '[Ontologies] Load Project Ontologies';
  constructor(public projectIri: string) {}
}

export class SetOntologiesLoadingAction {
  static readonly type = '[Ontologies] Set Ontologies Loading';
  constructor(public isLoading: boolean) {}
}

export class LoadOntologyAction {
  static readonly type = '[Ontologies] Load Ontology';
  constructor(
    public ontologyIri: string,
    public projectUuid: string,
    public stopLoadingWhenCompleted: boolean = true
  ) {}
}

export class UpdateOntologyAction {
  static readonly type = '[Ontologies] Update Ontology';
  constructor(
    public ontologyMetadata: UpdateOntologyMetadata,
    public projectUuid: string
  ) {}
}

export class ClearProjectOntologiesAction {
  static readonly type = '[Ontologies] Clear Project Ontologies';
  constructor(public projectUuid: string) {}
}

export class ClearCurrentOntologyAction {
  static readonly type = '[Ontologies] Clear Current Ontology Action';
}

export class ClearOntologiesAction {
  static readonly type = '[Ontologies] Clear Ontologies';
}

export class SetCurrentOntologyAction {
  static readonly type = '[Ontologies] Set Current Ontology';
  constructor(public readOntology: ReadOntology) {}
}

export class UpdateProjectOntologyAction {
  static readonly type = '[Ontologies] Update Project Ontology';
  constructor(
    public readOntology: ReadOntology,
    public projectUuid: string
  ) {}
}

export class RemoveProjectOntologyAction {
  static readonly type = '[Ontologies] Remove Project Ontology';
  constructor(
    public readOntologyId: string,
    public projectUuid: string
  ) {}
}

export class SetCurrentProjectOntologyPropertiesAction {
  static readonly type = '[Ontologies] Set Current Project Ontology Properties';
  constructor(public projectUuid: string) {}
}

export class RemovePropertyAction {
  static readonly type = '[Ontologies] Remove Property';
  constructor(
    public property: DefaultClass,
    public resourceClass: ClassDefinition,
    public currentOntologyPropertiesToDisplay: PropToDisplay[]
  ) {}
}

export class ReplacePropertyAction {
  static readonly type = '[Ontologies] Replace Property';
  constructor(
    public resourceClass: ClassDefinition,
    public currentOntologyPropertiesToDisplay: PropToDisplay[]
  ) {}
}

export class CurrentOntologyCanBeDeletedAction {
  static readonly type = '[Ontologies] Current Ontology Can Be Deleted';
}
