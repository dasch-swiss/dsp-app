import { Injectable } from '@angular/core';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { ProjectApiService, UserApiService } from '@dasch-swiss/vre/shared/app-api';
import { Action, State, StateContext, Store } from '@ngxs/store';
import { map, take } from 'rxjs/operators';
import { ProjectsSelectors } from '../projects/projects.selectors';
import { UserSelectors } from '../user/user.selectors';
import {
  GetAttachedProjectAction,
  GetAttachedUserAction,
  ToggleShowAllCommentsAction,
  ToggleShowAllPropsAction,
} from './resource.actions';
import { ReourceStateModel } from './resource.state-model';

const defaults = <ReourceStateModel>{
  showAllProps: false,
  showAllComments: false,
  isLoading: false,
  attachedProjects: {},
  attachedUsers: {},
};

@State<ReourceStateModel>({
  defaults,
  name: 'resource',
})
@Injectable()
export class ResourceState {
  constructor(
    private store: Store,
    private _userApiService: UserApiService,
    private _projectApiService: ProjectApiService
  ) {}

  @Action(ToggleShowAllPropsAction)
  toggleShowAllPropsAction(ctx: StateContext<ReourceStateModel>) {
    ctx.patchState({ showAllProps: !ctx.getState().showAllProps });
  }

  @Action(ToggleShowAllCommentsAction)
  toggleShowAllCommentsAction(ctx: StateContext<ReourceStateModel>) {
    ctx.patchState({ showAllComments: !ctx.getState().showAllComments });
  }

  @Action(GetAttachedUserAction)
  getAttachedUser(ctx: StateContext<ReourceStateModel>, { resourceIri, identifier, idType }: GetAttachedUserAction) {
    const state = ctx.getState();
    if (state.attachedUsers[resourceIri]) {
      const attachedUserIndex = state.attachedUsers[resourceIri].value.findIndex(e => e.id === identifier);
      if (attachedUserIndex > -1) {
        return state.attachedUsers[resourceIri].value[attachedUserIndex];
      }
    } else {
      state.attachedUsers[resourceIri] = { value: [] };
    }

    ctx.patchState({ isLoading: true });
    const user = this.store.selectSnapshot(UserSelectors.allUsers).find(u => u.id === identifier);
    if (user) {
      state.attachedUsers[resourceIri].value.push(user);
      ctx.setState({
        ...state,
        isLoading: false,
      });

      return user;
    }

    return this._userApiService.get(identifier, idType).pipe(
      take(1),
      map(response => {
        state.attachedUsers[resourceIri].value.push(response.user);
        ctx.patchState({
          ...state,
          isLoading: false,
        });

        return response.user;
      })
    );
  }

  @Action(GetAttachedProjectAction)
  getAttachedProject(ctx: StateContext<ReourceStateModel>, { resourceIri, projectIri }: GetAttachedProjectAction) {
    const state = ctx.getState();
    if (state.attachedProjects[resourceIri]) {
      const attachedProjectIndex = state.attachedProjects[resourceIri].value.findIndex(e => e.id === projectIri);
      if (attachedProjectIndex > -1) {
        return state.attachedProjects[resourceIri].value[attachedProjectIndex];
      }
    } else {
      state.attachedProjects[resourceIri] = { value: [] };
    }

    ctx.patchState({ isLoading: true });
    const project = this.store
      .selectSnapshot(ProjectsSelectors.allProjects)
      .find(u => u.id === projectIri) as ReadProject;
    if (project) {
      state.attachedProjects[resourceIri].value.push(project);
      ctx.setState({
        ...state,
        isLoading: false,
      });

      return project;
    }

    return this._projectApiService.get(projectIri).pipe(
      take(1),
      map(response => {
        state.attachedProjects[resourceIri].value.push(response.project);
        ctx.setState({
          ...state,
          isLoading: false,
        });

        return response.project;
      })
    );
  }
}
