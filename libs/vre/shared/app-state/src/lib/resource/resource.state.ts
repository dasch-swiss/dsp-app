import { Injectable } from '@angular/core';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { ProjectApiService, UserApiService } from '@dasch-swiss/vre/shared/app-api';
import { Action, State, StateContext, Store } from '@ngxs/store';
import { map, take } from 'rxjs/operators';
import { ProjectsSelectors } from '../projects/projects.selectors';
import { UserSelectors } from '../user/user.selectors';
import { GetAttachedProjectAction, GetAttachedUserAction, SetCurrentResourceAction } from './resource.actions';
import { ReourceStateModel } from './resource.state-model';

const defaults = <ReourceStateModel>{
  isLoading: false,
  attachedProjects: {},
  attachedUsers: {},
  resource: null,
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
      ctx.setState({
        ...state,
        attachedProjects: {
          ...state.attachedProjects,
          [resourceIri]: { value: [...state.attachedProjects[resourceIri].value, project] },
        },
        isLoading: false,
      });

      return project;
    }

    return this._projectApiService.get(projectIri).pipe(
      take(1),
      map(response => {
        ctx.setState({
          ...state,
          attachedProjects: {
            ...state.attachedProjects,
            [resourceIri]: { value: [...state.attachedProjects[resourceIri].value, response.project] },
          },
          isLoading: false,
        });

        return response.project;
      })
    );
  }

  @Action(SetCurrentResourceAction)
  setCurrentOntologyAction(ctx: StateContext<ReourceStateModel>, { resource }: SetCurrentResourceAction) {
    ctx.patchState({ resource });
  }
}
