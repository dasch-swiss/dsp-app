import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminProjectsApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Action, State, StateContext } from '@ngxs/store';
import { produce } from 'immer';
import { finalize, take, tap } from 'rxjs';
import {
  ClearProjectsAction,
  LoadProjectAction,
  LoadProjectRestrictedViewSettingsAction,
  LoadProjectsAction,
  UpdateProjectAction,
  UpdateProjectRestrictedViewSettingsAction,
} from './projects.actions';
import { ProjectsStateModel } from './projects.state-model';

const defaults: ProjectsStateModel = {
  isLoading: false,
  allProjects: [], // all projects in the system grouped by project IRI
  projectRestrictedViewSettings: {}, // project image settings grouped by project id
};

/*
  Provides data about projects, including their members, user groups, and settings.
*/
@State<ProjectsStateModel>({
  defaults,
  name: 'projects',
})
@Injectable()
export class ProjectsState {
  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private projectService: ProjectService,
    private projectApiService: ProjectApiService,
    private adminProjectsApiService: AdminProjectsApiService
  ) {}

  @Action(LoadProjectsAction, { cancelUncompleted: true })
  loadProjects(ctx: StateContext<ProjectsStateModel>) {
    ctx.patchState({ isLoading: true });
    return this.projectApiService.list().pipe(
      tap({
        next: response => {
          ctx.setState({
            ...ctx.getState(),
            isLoading: false,
            allProjects: response.projects,
          });
        },
      }),
      finalize(() => {
        ctx.patchState({ isLoading: false });
      })
    );
  }

  @Action(LoadProjectAction, { cancelUncompleted: true })
  loadProjectAction(ctx: StateContext<ProjectsStateModel>, { projectUuid, loadMembership }: LoadProjectAction) {
    ctx.patchState({ isLoading: true });

    const projectIri = this.projectService.uuidToIri(projectUuid);
    // get current project data, project members and project groups
    // and set the project state here
    return this._dspApiConnection.admin.projectsEndpoint.getProjectByIri(projectIri).pipe(
      take(1),
      tap({
        next: response => {
          const project = response.body.project;

          let state = ctx.getState();
          if (!state.allProjects) {
            state.allProjects = [];
          }

          state = produce(state, draft => {
            const index = draft.allProjects.findIndex(p => p.id === project.id);
            if (index > -1) {
              draft.allProjects[index] = project;
            } else {
              draft.allProjects.push(project);
            }
            draft.isLoading = false;
          });

          ctx.patchState(state);
          return project;
        },
      }),
      finalize(() => {
        ctx.patchState({ isLoading: false });
      })
    );
  }

  @Action(ClearProjectsAction)
  clearProjects(ctx: StateContext<ProjectsStateModel>) {
    ctx.patchState(defaults);
  }

  @Action(UpdateProjectAction)
  updateProjectAction(ctx: StateContext<ProjectsStateModel>, { projectUuid, projectData }: UpdateProjectAction) {
    ctx.patchState({ isLoading: true });
    return this.projectApiService.update(this.projectService.uuidToIri(projectUuid), projectData).pipe(
      tap({
        next: response => {
          ctx.dispatch(new LoadProjectsAction());
        },
      }),
      finalize(() => {
        ctx.patchState({ isLoading: false });
      })
    );
  }

  @Action(LoadProjectRestrictedViewSettingsAction, { cancelUncompleted: true })
  projectRestrictedViewSettings(
    ctx: StateContext<ProjectsStateModel>,
    { projectIri }: LoadProjectRestrictedViewSettingsAction
  ) {
    ctx.patchState({ isLoading: true });
    return this.projectApiService.getRestrictedViewSettingsForProject(projectIri).pipe(
      tap({
        next: response => {
          ctx.setState({
            ...ctx.getState(),
            projectRestrictedViewSettings: {
              [ProjectService.IriToUuid(projectIri)]: { value: response.settings },
            },
          });
        },
      }),
      finalize(() => {
        ctx.patchState({ isLoading: false });
      })
    );
  }

  @Action(UpdateProjectRestrictedViewSettingsAction)
  updateProjectRestrictedViewSettingsAction(
    ctx: StateContext<ProjectsStateModel>,
    { projectUuid, setRestrictedViewRequest }: UpdateProjectRestrictedViewSettingsAction
  ) {
    ctx.patchState({ isLoading: true });
    return this.adminProjectsApiService
      .postAdminProjectsIriProjectiriRestrictedviewsettings(
        this.projectService.uuidToIri(projectUuid),
        setRestrictedViewRequest
      )
      .pipe(
        tap({
          next: response => {
            ctx.setState({
              ...ctx.getState(),
              projectRestrictedViewSettings: {
                [projectUuid]: { value: response },
              },
            });
          },
        }),
        finalize(() => {
          ctx.patchState({ isLoading: false });
        })
      );
  }
}
