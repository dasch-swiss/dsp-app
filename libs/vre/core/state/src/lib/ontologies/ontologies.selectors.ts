import { Params } from '@angular/router';
import {
  ClassDefinition,
  OntologyMetadata,
  ReadOntology,
  ReadProject,
  ResourceClassDefinition,
  ResourceClassDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { DspAppConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { OntologyService, ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Selector } from '@ngxs/store';
import { ConfigState } from '../config.state';
import { IProjectOntologiesKeyValuePairs, OntologyProperties } from '../model-interfaces';
import { ProjectsSelectors } from '../projects/projects.selectors';
import { ResourceSelectors } from '../resource/resource.selectors';
import { RouterSelectors } from '../router/router.selector';
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

  @Selector([OntologiesState])
  static isOntologiesLoading(state: OntologiesStateModel): boolean {
    return state.isOntologiesLoading;
  }

  @Selector([OntologiesState, ResourceSelectors.resource, ConfigState.getConfig, RouterSelectors.params])
  static projectOntology(
    state: OntologiesStateModel,
    resource: DspResource,
    dspApiConfig: DspAppConfig,
    params: Params
  ): ReadOntology | undefined {
    const projectIri = ProjectService.getProjectIri(params, dspApiConfig, resource);
    if (!projectIri || Object.values(state.projectOntologies).length === 0) return undefined;

    const projectReadOntologies = state.projectOntologies[projectIri].readOntologies;
    const projectReadOntologiesIndex = projectReadOntologies.findIndex(
      o => o.id.indexOf(`/${params[RouteConstants.ontoParameter]}/`) !== -1
    );

    return projectReadOntologiesIndex === -1 ? undefined : projectReadOntologies[projectReadOntologiesIndex];
  }

  @Selector([RouterSelectors.params, OntologiesSelectors.projectOntology])
  static currentOntologyClass(
    params: Params,
    projectOntology: ReadOntology | undefined
  ): ClassDefinition | ResourceClassDefinition | ResourceClassDefinitionWithAllLanguages | undefined {
    if (!projectOntology) {
      return undefined;
    } else {
      const currentOntoClass = Object.values(projectOntology.classes).find(
        c => c.id.indexOf(`#${params[RouteConstants.classParameter]}`) !== -1
      );
      return currentOntoClass;
    }
  }
}
