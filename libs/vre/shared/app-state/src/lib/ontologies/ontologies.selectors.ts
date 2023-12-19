import { OntologyMetadata, ReadOntology, ReadProject } from '@dasch-swiss/dsp-js';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Selector } from '@ngxs/store';
import { IProjectOntologiesKeyValuePairs, OntologyProperties } from '../model-interfaces';
import { ProjectsSelectors } from '../projects/projects.selectors';
import { OntologiesState } from './ontologies.state';
import { OntologiesStateModel } from './ontologies.state-model';

export class OntologiesSelectors {
  @Selector([OntologiesState])
  static isLoading(state: OntologiesStateModel): boolean | undefined {
    return state.isLoading;
  }

  @Selector([OntologiesState])
  static hasLoadingErrors(state: OntologiesStateModel): boolean | undefined {
    return state.hasLoadingErrors;
  }

  @Selector([OntologiesState])
  static projectOntologies(state: OntologiesStateModel): IProjectOntologiesKeyValuePairs {
    return state.projectOntologies;
  }

  @Selector([OntologiesState, ProjectsSelectors.currentProject])
  static currentProjectOntologyMetadata(state: OntologiesStateModel, project: ReadProject): OntologyMetadata[] {
    return state.projectOntologies[project.id] ? state.projectOntologies[project.id].ontologiesMetadata : [];
  }

  @Selector([OntologiesState, ProjectsSelectors.currentProject])
  static currentProjectOntologies(state: OntologiesStateModel, project: ReadProject): ReadOntology[] {
    return state.projectOntologies[project.id] ? state.projectOntologies[project.id].readOntologies : [];
  }

  // ontology name has to be unique
  @Selector([OntologiesState, ProjectsSelectors.currentProject])
  static currentProjectExistingOntologyNames(state: OntologiesStateModel, project: ReadProject): string[] {
    return state.projectOntologies[project.id].ontologiesMetadata.map(meta => OntologyService.getOntologyName(meta.id));
  }

  @Selector([OntologiesState])
  static currentOntology(state: OntologiesStateModel): ReadOntology | null {
    return state.currentOntology?.id ? state.currentOntology : null;
  }

  @Selector([OntologiesState])
  static currentProjectOntologyProperties(state: OntologiesStateModel): OntologyProperties[] {
    return state.currentProjectOntologyProperties;
  }

  @Selector([OntologiesState])
  static currentOntologyCanBeDeleted(state: OntologiesStateModel): boolean {
    return state.currentOntologyCanBeDeleted;
  }
}
