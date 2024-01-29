import { Inject, Injectable } from '@angular/core';
import {
  ApiResponseData,
  ApiResponseError,
  GroupsResponse,
  KnoraApiConnection,
  MembersResponse,
  ProjectResponse,
  ReadGroup,
  ReadUser,
  UserResponse,
} from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/shared/app-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Action, Actions, State, StateContext, Store, ofActionSuccessful } from '@ngxs/store';
import { produce } from 'immer';
import { EMPTY, of } from 'rxjs';
import { concatMap, finalize, map, take, tap } from 'rxjs/operators';
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
  LoadProjectsAction,
  RemoveUserFromProjectAction,
  SetProjectMemberAction,
  UpdateProjectAction,
} from './projects.actions';
import { ProjectsStateModel } from './projects.state-model';

const defaults: ProjectsStateModel = {
  isLoading: false,
  isMembershipLoading: false,
  hasLoadingErrors: false,
  allProjects: [],
  projectMembers: {},
  projectGroups: {},
};

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
    private errorHandler: AppErrorHandler,
    private projectService: ProjectService,
    private projectApiService: ProjectApiService,
    private actions: Actions
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
      map(
        (projectsResponse: ApiResponseData<ProjectResponse> | ApiResponseError) =>
          projectsResponse as ApiResponseData<ProjectResponse>
      ),
      tap({
        next: (response: ApiResponseData<ProjectResponse>) => {
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
  loadProjectMembershipAction(ctx: StateContext<ProjectsStateModel>, { projectUuid }: LoadProjectAction) {
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
      map((response: ApiResponseData<UserResponse> | ApiResponseError) => response as ApiResponseData<UserResponse>),
      tap({
        next: (response: ApiResponseData<UserResponse>) => {
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
      map((response: ApiResponseData<UserResponse> | ApiResponseError) => response as ApiResponseData<UserResponse>),
      tap({
        next: (response: ApiResponseData<UserResponse>) => {
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
      map(
        (membersResponse: ApiResponseData<MembersResponse> | ApiResponseError) =>
          membersResponse as ApiResponseData<MembersResponse>
      ),
      tap({
        next: (response: ApiResponseData<MembersResponse>) => {
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
      map(
        (groupsResponse: ApiResponseData<GroupsResponse> | ApiResponseError) =>
          groupsResponse as ApiResponseData<GroupsResponse>
      ),
      tap({
        next: (response: ApiResponseData<GroupsResponse>) => {
          const groups: IKeyValuePairs<ReadGroup> = {};
          response.body.groups.forEach(group => {
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
}
