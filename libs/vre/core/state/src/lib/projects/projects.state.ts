import { Inject, Injectable } from '@angular/core';
import { ApiResponseError, KnoraApiConnection, ReadGroup, ReadUser } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminProjectsApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Action, Actions, ofActionSuccessful, State, StateContext, Store } from '@ngxs/store';
import { produce } from 'immer';
import { concatMap, EMPTY, finalize, map, of, take, tap } from 'rxjs';
import { IKeyValuePairs } from '../model-interfaces';
import { SetUserAction } from '../user/user.actions';
import { UserSelectors } from '../user/user.selectors';
import {
  AddUserToProjectMembershipAction,
  ClearProjectsAction,
  ClearProjectsMembershipAction,
  LoadProjectAction,
  LoadProjectGroupsAction,
  LoadProjectMembersAction,
  LoadProjectMembershipAction,
  LoadProjectRestrictedViewSettingsAction,
  LoadProjectsAction,
  RemoveUserFromProjectAction,
  SetProjectMemberAction,
  UpdateProjectAction,
  UpdateProjectRestrictedViewSettingsAction,
} from './projects.actions';
import { ProjectsStateModel } from './projects.state-model';

const defaults: ProjectsStateModel = {
  isLoading: false,
  isMembershipLoading: false, // loading state of project membership
  hasLoadingErrors: false, // loading error state
  allProjects: [], // all projects in the system grouped by project IRI
  projectMembers: {}, // project members grouped by project IRI
  projectGroups: {}, // project user groups grouped by project IRI
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
    private store: Store,
    private projectService: ProjectService,
    private projectApiService: ProjectApiService,
    private actions: Actions,
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
        error: (error: ApiResponseError) => {
          ctx.patchState({ hasLoadingErrors: true });
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
        error: (error: ApiResponseError) => {
          ctx.patchState({ hasLoadingErrors: true });
        },
      }),
      concatMap(() => {
        return loadMembership ? ctx.dispatch(new LoadProjectMembershipAction(projectUuid)) : EMPTY;
      }),
      finalize(() => {
        ctx.patchState({ isLoading: false });
      })
    );
  }

  @Action(LoadProjectMembershipAction, { cancelUncompleted: true })
  loadProjectMembershipAction(ctx: StateContext<ProjectsStateModel>, { projectUuid }: LoadProjectMembershipAction) {
    const projectIri = this.projectService.uuidToIri(projectUuid);
    const user = this.store.selectSnapshot(UserSelectors.user) as ReadUser;
    const userProjectAdminGroups = this.store.selectSnapshot(UserSelectors.userProjectAdminGroups);
    const isProjectAdmin = ProjectService.IsProjectAdminOrSysAdmin(user, userProjectAdminGroups, projectIri);
    if (isProjectAdmin) {
      ctx.patchState({ isMembershipLoading: true });
      ctx.dispatch([new LoadProjectMembersAction(projectUuid), new LoadProjectGroupsAction(projectUuid)]);
      this.actions.pipe(take(1), ofActionSuccessful(LoadProjectGroupsAction)).subscribe(() => {
        ctx.patchState({ isMembershipLoading: false });
      });
    }
  }

  @Action(ClearProjectsAction)
  clearProjects(ctx: StateContext<ProjectsStateModel>) {
    ctx.patchState(defaults);
  }

  @Action(ClearProjectsMembershipAction)
  clearProjectsMembership(ctx: StateContext<ProjectsStateModel>) {
    return of(ctx.getState()).pipe(
      map(currentState => {
        currentState.projectMembers = defaults.projectMembers;
        currentState.projectGroups = defaults.projectGroups;
        ctx.patchState(currentState);
        return currentState;
      })
    );
  }

  @Action(RemoveUserFromProjectAction)
  removeUserFromProject(ctx: StateContext<ProjectsStateModel>, { userId, projectIri }: RemoveUserFromProjectAction) {
    ctx.patchState({ isMembershipLoading: true });
    return this._dspApiConnection.admin.usersEndpoint.removeUserFromProjectMembership(userId, projectIri).pipe(
      take(1),
      tap({
        next: response => {
          ctx.dispatch([new SetUserAction(response.body.user), new LoadProjectMembersAction(projectIri)]);
          ctx.patchState({ isMembershipLoading: false });
        },
      })
    );
  }

  @Action(AddUserToProjectMembershipAction)
  addUserToProjectMembership(
    ctx: StateContext<ProjectsStateModel>,
    { userId, projectIri }: AddUserToProjectMembershipAction
  ) {
    ctx.patchState({ isMembershipLoading: true, hasLoadingErrors: false });
    return this._dspApiConnection.admin.usersEndpoint.addUserToProjectMembership(userId, projectIri).pipe(
      take(1),
      tap({
        next: response => {
          ctx.dispatch([new SetUserAction(response.body.user), new LoadProjectMembersAction(projectIri)]);
          ctx.patchState({ isMembershipLoading: false });
        },
        error: error => {
          ctx.patchState({ hasLoadingErrors: true });
        },
      })
    );
  }

  @Action(LoadProjectMembersAction)
  loadProjectMembersAction(ctx: StateContext<ProjectsStateModel>, { projectUuid }: LoadProjectMembersAction) {
    if (!this.store.selectSnapshot(UserSelectors.isLoggedIn)) {
      return;
    }

    ctx.patchState({ isMembershipLoading: true });
    const projectIri = this.projectService.uuidToIri(projectUuid);
    return this._dspApiConnection.admin.projectsEndpoint.getProjectMembersByIri(projectIri).pipe(
      take(1),
      tap({
        next: response => {
          ctx.setState({
            ...ctx.getState(),
            isMembershipLoading: false,
            projectMembers: {
              [projectIri]: { value: response.body.members },
            },
          });
        },
        error: error => {
          ctx.patchState({ hasLoadingErrors: true });
        },
      })
    );
  }

  @Action(LoadProjectGroupsAction)
  loadProjectGroupsAction(ctx: StateContext<ProjectsStateModel>) {
    ctx.patchState({ isMembershipLoading: true });
    return this._dspApiConnection.admin.groupsEndpoint.getGroups().pipe(
      take(1),
      tap({
        next: response => {
          const groups: IKeyValuePairs<ReadGroup> = {};
          response.body.groups.forEach((group: ReadGroup) => {
            const projectId = group.project?.id as string;
            if (!groups[projectId]) {
              groups[projectId] = { value: [] };
            }

            groups[projectId].value = [...groups[projectId].value, group];
          });

          ctx.setState({
            ...ctx.getState(),
            isMembershipLoading: false,
            projectGroups: groups,
          });
        },
      })
    );
  }

  @Action(UpdateProjectAction)
  updateProjectAction(ctx: StateContext<ProjectsStateModel>, { projectUuid, projectData }: UpdateProjectAction) {
    ctx.patchState({ isLoading: true });
    return this.projectApiService.update(this.projectService.uuidToIri(projectUuid), projectData).pipe(
      tap({
        next: response => {
          ctx.dispatch(new LoadProjectsAction());
        },
        error: () => {
          ctx.patchState({ hasLoadingErrors: true });
        },
      }),
      finalize(() => {
        ctx.patchState({ isLoading: false });
      })
    );
  }

  @Action(SetProjectMemberAction)
  setProjectMember(ctx: StateContext<ProjectsStateModel>, { member }: SetProjectMemberAction) {
    const state = ctx.getState();
    Object.keys(state.projectMembers).forEach(projectId => {
      const index = state.projectMembers[projectId].value.findIndex(u => u.id === member.id);
      if (index > -1) {
        state.projectMembers[projectId].value[index] = member;
      }
    });

    ctx.setState({ ...state });
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
