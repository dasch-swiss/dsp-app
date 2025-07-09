import { Inject, Injectable } from '@angular/core';
import { ApiResponseError, Constants, KnoraApiConnection, PropertyDefinition, ReadOntology } from '@dasch-swiss/dsp-js';
import { getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { OntologyService, ProjectService, SortingService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Action, Actions, ofActionSuccessful, State, StateContext } from '@ngxs/store';
import { map, of, switchMap, take, tap } from 'rxjs';
import { LoadListsInProjectAction } from '../lists/lists.actions';
import { IProjectOntologiesKeyValuePairs, OntologyProperties } from '../model-interfaces';
import {
  ClearCurrentOntologyAction,
  ClearOntologiesAction,
  ClearProjectOntologiesAction,
  CurrentOntologyCanBeDeletedAction,
  LoadOntologyAction,
  LoadProjectOntologiesAction,
  RemoveProjectOntologyAction,
  ResetCurrentOntologyAction,
  SetCurrentOntologyAction,
  SetCurrentProjectOntologyPropertiesAction,
  SetOntologiesLoadingAction,
  SetOntologyAction,
  UpdateOntologyAction,
  UpdateProjectOntologyAction,
} from './ontologies.actions';
import { OntologiesStateModel } from './ontologies.state-model';

const defaults: OntologiesStateModel = <OntologiesStateModel>{
  isLoading: false,
  projectOntologies: {}, // project ontologies grouped by project IRI
  hasLoadingErrors: false, // loading error state
  currentOntology: null, // the currently selected ontology
  currentOntologyCanBeDeleted: false,
  currentProjectOntologyProperties: [], // reflects current ontology properties in data model grouped by ontology IRI
  isOntologiesLoading: false, // loading state for project ontologies
};

/*
  Provides data about the ontologies in a project, resource viewer, ontology editor.
*/
@State<OntologiesStateModel>({
  defaults,
  name: 'ontologies',
})
@Injectable()
export class OntologiesState {
  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _sortingService: SortingService,
    private _projectService: ProjectService,
    private _actions$: Actions
  ) {}

  // TODO Remove this action when all actions containing this usage is implemented
  @Action(SetOntologiesLoadingAction)
  setOntologiesLoadingAction(ctx: StateContext<OntologiesStateModel>, { isLoading }: SetOntologiesLoadingAction) {
    ctx.patchState({ isLoading });
  }

  @Action(SetCurrentOntologyAction)
  setCurrentOntologyAction(ctx: StateContext<OntologiesStateModel>, { readOntology }: SetCurrentOntologyAction) {
    ctx.patchState({ currentOntology: readOntology });
  }

  @Action(ResetCurrentOntologyAction)
  resetCurrentOntologyAction(
    ctx: StateContext<OntologiesStateModel>,
    { ontology, projectIri }: ResetCurrentOntologyAction
  ) {
    ctx.dispatch(new SetOntologyAction(ontology, projectIri));
    ctx.dispatch(new SetCurrentOntologyAction(ontology));
  }

  @Action(UpdateProjectOntologyAction)
  updateProjectOntologyAction(
    ctx: StateContext<OntologiesStateModel>,
    { readOntology, projectUuid }: UpdateProjectOntologyAction
  ) {
    const state = ctx.getState();
    const readOntologies = state.projectOntologies[projectUuid].readOntologies;
    readOntologies[readOntologies.findIndex(onto => onto.id === readOntology.id)] = readOntology;
    ctx.patchState(state);
  }

  @Action(RemoveProjectOntologyAction)
  removeProjectOntologyAction(
    ctx: StateContext<OntologiesStateModel>,
    { readOntologyId, projectUuid }: RemoveProjectOntologyAction
  ) {
    const state = ctx.getState();
    const readOntologies = state.projectOntologies[projectUuid].readOntologies;
    const index = readOntologies.findIndex(onto => onto.id === readOntologyId);
    if (index > -1) {
      readOntologies.splice(index, 1);
    }
    ctx.patchState(state);
  }

  @Action(SetOntologyAction)
  setOntologyAction(ctx: StateContext<OntologiesStateModel>, { ontology, projectIri }: SetOntologyAction) {
    const state = ctx.getState();
    const existing = state.projectOntologies[projectIri]?.readOntologies || [];

    const updatedOntologies = existing.map(o => (o.id === ontology.id ? ontology : o));
    const isNew = !existing.some(o => o.id === ontology.id);

    const newReadOntologies = isNew ? [...existing, ontology] : updatedOntologies;

    ctx.setState({
      ...state,
      projectOntologies: {
        ...state.projectOntologies,
        [projectIri]: {
          ...state.projectOntologies[projectIri],
          readOntologies: newReadOntologies,
        },
      },
    });
  }

  @Action(LoadProjectOntologiesAction)
  loadProjectOntologiesAction(
    ctx: StateContext<OntologiesStateModel>,
    { projectIri, ontologyName }: LoadProjectOntologiesAction
  ) {
    ctx.patchState({ isOntologiesLoading: true, isLoading: true });
    projectIri = this._projectService.uuidToIri(projectIri);

    // get all project ontologies
    return this._dspApiConnection.v2.onto.getOntologiesByProjectIri(projectIri).pipe(
      take(1),
      tap({
        next: ontoMeta => {
          if (!ontoMeta.ontologies.length) {
            ctx.dispatch(new LoadListsInProjectAction(projectIri));
            ctx.patchState({ isLoading: false });
            return;
          }

          const projectOntologies: IProjectOntologiesKeyValuePairs = {
            [projectIri]: {
              ontologiesMetadata: ontoMeta.ontologies,
              readOntologies: [],
            },
          };
          ctx.setState({ ...ctx.getState(), projectOntologies });
          // TODO should load ontologies as a batch with dedicated endpoint, not one by one
          ctx
            .dispatch(
              // dispatch all actions except the last one to keep the loading state
              ontoMeta.ontologies
                .slice(0, ontoMeta.ontologies.length - 1)
                .map(onto => new LoadOntologyAction(onto.id, projectIri, false))
            )
            .pipe(
              take(1),
              tap(() =>
                ctx.dispatch(
                  new LoadOntologyAction(ontoMeta.ontologies[ontoMeta.ontologies.length - 1].id, projectIri, true)
                )
              )
            )
            .pipe(switchMap(() => this._actions$.pipe(ofActionSuccessful(LoadOntologyAction), take(1)))) // last action dispatched
            .subscribe(() => {
              if (ontologyName) {
                const readOntology = ctx
                  .getState()
                  .projectOntologies[
                    projectIri
                  ].readOntologies.find(o => o.id === OntologyService.getOntologyName(ontologyName));
                if (readOntology) {
                  ctx.dispatch(new SetCurrentOntologyAction(readOntology));
                }
              }

              ctx.dispatch(new LoadListsInProjectAction(projectIri));
              ctx.patchState({ isOntologiesLoading: false });
            });
        },
        error: (error: ApiResponseError) => {
          ctx.patchState({ hasLoadingErrors: true, isLoading: false });
        },
      })
    );
  }

  @Action(LoadOntologyAction)
  loadOntologyAction(
    ctx: StateContext<OntologiesStateModel>,
    { ontologyIri, projectUuid, stopLoadingWhenCompleted }: LoadOntologyAction
  ) {
    ctx.patchState({ isLoading: true });
    return this._dspApiConnection.v2.onto.getOntology(ontologyIri, true).pipe(
      take(1),
      tap({
        next: ontology => {
          const projectIri = this._projectService.uuidToIri(projectUuid);
          let projectOntologiesState = ctx.getState().projectOntologies;
          if (!projectOntologiesState[projectIri]) {
            projectOntologiesState = {
              [projectIri]: { ontologiesMetadata: [], readOntologies: [] },
            };
          }

          let projectReadOntologies = projectOntologiesState[projectIri].readOntologies;
          const projectReadOntologiesIndex = projectReadOntologies.findIndex(o => o.id === ontology.id);
          if (projectReadOntologiesIndex > -1) {
            projectReadOntologies[projectReadOntologiesIndex] = ontology;
          } else {
            projectReadOntologies.push(ontology);
          }

          projectReadOntologies = projectReadOntologies.sort((o1, o2) => this._compareOntologies(o1, o2));
          // this._sortingService.keySortByAlphabetical(projectReadOntologies, 'labels');
          projectOntologiesState[projectIri].readOntologies = projectReadOntologies;

          if (ontology.id === ctx.getState().currentOntology?.id) {
            ctx.dispatch(new SetCurrentOntologyAction(ontology));
          }

          ctx.setState({
            ...ctx.getState(),
            isLoading: !stopLoadingWhenCompleted,
            projectOntologies: { ...projectOntologiesState }, // batch update with a new reference!
          });
        },
        error: (error: ApiResponseError) => {
          ctx.patchState({ hasLoadingErrors: true, isLoading: false });
        },
      })
    );
  }

  @Action(UpdateOntologyAction)
  updateOntologyAction(
    ctx: StateContext<OntologiesStateModel>,
    { ontologyMetadata, projectUuid }: UpdateOntologyAction
  ) {
    ctx.patchState({ isLoading: true });
    return this._dspApiConnection.v2.onto.updateOntology(ontologyMetadata).pipe(
      take(1),
      tap({
        next: () => {
          const projectIri = this._projectService.uuidToIri(projectUuid);
          ctx.dispatch(new LoadProjectOntologiesAction(projectIri));
        },
        error: (error: ApiResponseError) => {
          ctx.patchState({ hasLoadingErrors: true });
        },
      })
    );
  }

  @Action(ClearProjectOntologiesAction)
  clearProjectOntologies(ctx: StateContext<OntologiesStateModel>, { projectUuid }: ClearProjectOntologiesAction) {
    const projectIri = this._projectService.uuidToIri(projectUuid);
    return of(ctx.getState()).pipe(
      map(currentState => {
        if (currentState.projectOntologies[projectIri]) {
          currentState.projectOntologies[projectIri].ontologiesMetadata = [];
          currentState.projectOntologies[projectIri].readOntologies = [];
          ctx.patchState(currentState);
        }

        return currentState;
      })
    );
  }

  @Action(ClearOntologiesAction)
  clearOntologies(ctx: StateContext<OntologiesStateModel>) {
    return of(ctx.getState()).pipe(
      map(currentState => {
        ctx.patchState(defaults);
        return currentState;
      })
    );
  }

  @Action(ClearCurrentOntologyAction)
  clearCurrentOntology(ctx: StateContext<OntologiesStateModel>) {
    const state = ctx.getState();
    state.currentOntology = defaults.currentOntology;
    state.currentProjectOntologyProperties = defaults.currentProjectOntologyProperties;
    ctx.patchState(state);
  }

  // don't log error to rollbar if 'currentProjectOntologies' does not exist in the application state
  @Action(SetCurrentProjectOntologyPropertiesAction)
  setCurrentProjectOntologyPropertiesAction(
    ctx: StateContext<OntologiesStateModel>,
    { projectUuid }: SetCurrentProjectOntologyPropertiesAction
  ) {
    const state = ctx.getState();
    if (!state.projectOntologies[projectUuid]) {
      return;
    }
    // get all project ontologies
    const projectOntologies = state.projectOntologies[projectUuid].readOntologies;
    const ontoProperties = <OntologyProperties[]>projectOntologies.map(
      onto =>
        <OntologyProperties>{
          ontology: onto.id,
          properties: this.initOntoProperties(getAllEntityDefinitionsAsArray(onto.properties)),
        }
    );

    ctx.setState({
      ...state,
      currentProjectOntologyProperties: ontoProperties,
    });
  }

  @Action(CurrentOntologyCanBeDeletedAction)
  currentOntologyCanBeDeletedAction(ctx: StateContext<OntologiesStateModel>) {
    ctx.patchState({ isLoading: true });
    const state = ctx.getState();
    if (!state.currentOntology) {
      return;
    }

    return this._dspApiConnection.v2.onto.canDeleteOntology(state.currentOntology.id).pipe(
      take(1),
      tap({
        next: response => {
          ctx.setState({
            ...ctx.getState(),
            isLoading: false,
            currentOntologyCanBeDeleted: response.canDo,
          });
        },
        error: (error: ApiResponseError) => {
          ctx.patchState({ hasLoadingErrors: true });
        },
      })
    );
  }

  /**
   * compare function which sorts the ontologies in the ascending order.
   *
   * @param o1 ontology 1
   * @param o2 ontology 2
   * @private
   */
  private _compareOntologies(o1: ReadOntology, o2: ReadOntology) {
    if (o1.label > o2.label) {
      return 1;
    }

    if (o1.label < o2.label) {
      return -1;
    }

    return 0;
  }

  private initOntoProperties(allOntoProperties: PropertyDefinition[]): PropertyDefinition[] {
    // reset the ontology properties
    const listOfProperties: PropertyDefinition[] = [];

    // display only the properties which are not a subjectType of Standoff
    allOntoProperties.forEach(resProp => {
      const standoff = resProp.subjectType ? resProp.subjectType.includes('Standoff') : false;
      if (resProp.objectType !== Constants.LinkValue && !standoff) {
        listOfProperties.push(resProp);
      }
    });

    // sort properties by labels
    // --> TODO: add sort functionallity to the gui
    return this._sortingService.keySortByAlphabetical(listOfProperties, 'label');
  }
}
