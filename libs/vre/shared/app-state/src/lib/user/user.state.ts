import { Injectable } from '@angular/core';
import { ApiResponseError, Constants, ReadUser } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/shared/app-api';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { Action, State, StateContext } from '@ngxs/store';
import { of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { SetProjectMemberAction } from '../projects/projects.actions';
import {
  CreateUserAction,
  LoadUserAction,
  LoadUserContentByIriAction,
  LoadUsersAction,
  LogUserOutAction,
  RemoveUserAction,
  ResetUsersAction,
  SetUserAction,
  SetUserProjectGroupsAction,
} from './user.actions';
import { UserStateModel } from './user.state-model';

const defaults = <UserStateModel>{
  isLoading: false,
  user: null,
  userProjectAdminGroups: [],
  isMemberOfSystemAdminGroup: false,
  allUsers: [],
};

@State<UserStateModel>({
  defaults,
  name: 'user',
})
@Injectable()
export class UserState {
  constructor(
    private _userApiService: UserApiService,
    private _errorHandler: AppErrorHandler
  ) {}

  @Action(LoadUserAction)
  loadUser(ctx: StateContext<UserStateModel>, { username }: LoadUserAction) {
    ctx.patchState({ isLoading: true });
    return this._userApiService.get(username, 'username').pipe(
      take(1),
      map(response => {
        ctx.setState({
          ...ctx.getState(),
          isLoading: false,
          user: response.user,
        });
        ctx.dispatch(new SetUserProjectGroupsAction(response.user));
        return response.user;
      })
    );
  }

  @Action(LoadUserContentByIriAction)
  loadUserContentByIriAction(ctx: StateContext<UserStateModel>, { iri }: LoadUserContentByIriAction) {
    ctx.patchState({ isLoading: true });
    return this._userApiService.get(iri).pipe(
      take(1),
      tap({
        next: response => {
          const state = ctx.getState();
          const userIndex = state.allUsers.findIndex(u => u.id === response.user.id);
          if (userIndex > -1) {
            state.allUsers[userIndex] = response.user;
          }

          ctx.setState({
            ...state,
            isLoading: false,
          });
        },
        error: (error: ApiResponseError) => {
          this._errorHandler.showMessage(error);
        },
      })
    );
  }

  @Action(SetUserAction)
  setUser(ctx: StateContext<UserStateModel>, { user }: SetUserAction) {
    if (!user) return;

    const state = ctx.getState();
    const userIndex = state.allUsers.findIndex(u => u.id === user.id);
    if (userIndex > -1) {
      state.allUsers[userIndex] = user;
    }

    if ((<ReadUser>state.user).id === user.id) {
      state.user = user;
    }

    ctx.setState({ ...state, isLoading: false });
    ctx.dispatch([new SetUserProjectGroupsAction(user), new SetProjectMemberAction(user)]);
  }

  @Action(RemoveUserAction)
  removeUser(ctx: StateContext<UserStateModel>, { user }: RemoveUserAction) {
    const state = ctx.getState();
    state.allUsers.splice(
      state.allUsers.findIndex(u => u.id === user.id),
      1
    );

    ctx.setState({ ...state, isLoading: false });
  }

  @Action(SetUserProjectGroupsAction)
  setUserProjectGroupsData(ctx: StateContext<UserStateModel>, { user }: SetUserProjectGroupsAction) {
    let isMemberOfSystemAdminGroup = false;
    const userProjectGroups: string[] = [];

    // get permission information: a) is user sysadmin? b) get list of project iri's where user is project admin
    const groupsPerProject = user.permissions.groupsPerProject;

    if (groupsPerProject) {
      const groupsPerProjectKeys: string[] = Object.keys(groupsPerProject);

      for (const key of groupsPerProjectKeys) {
        if (key === Constants.SystemProjectIRI) {
          // is sysAdmin
          isMemberOfSystemAdminGroup = groupsPerProject[key].indexOf(Constants.SystemAdminGroupIRI) > -1;
        }

        if (groupsPerProject[key].indexOf(Constants.ProjectAdminGroupIRI) > -1) {
          // projectAdmin
          userProjectGroups.push(key);
        }
      }
    }

    const state = ctx.getState();
    if (state.user?.username === user.username) {
      state.userProjectAdminGroups = userProjectGroups;
      state.isMemberOfSystemAdminGroup = isMemberOfSystemAdminGroup;
    }

    ctx.setState({ ...state });
  }

  @Action(LogUserOutAction)
  logUserOut(ctx: StateContext<UserStateModel>) {
    ctx.setState(defaults);
  }

  @Action(LoadUsersAction)
  loadUsersAction(ctx: StateContext<UserStateModel>, { loadFullUserData }: LoadUsersAction) {
    ctx.patchState({ isLoading: true });
    return this._userApiService.list().pipe(
      take(1),
      tap({
        next: response => {
          ctx.setState({
            ...ctx.getState(),
            allUsers: response.users,
          });

          if (loadFullUserData) {
            response.users.map(u => ctx.dispatch(new LoadUserContentByIriAction(u.id)));
          }
        },
        error: error => {
          this._errorHandler.showMessage(error);
        },
      })
    );
  }

  @Action(ResetUsersAction)
  resetUsers(ctx: StateContext<UserStateModel>) {
    ctx.patchState({ allUsers: defaults.allUsers });
  }

  @Action(CreateUserAction)
  createUserAction(ctx: StateContext<UserStateModel>, { userData }: CreateUserAction) {
    ctx.patchState({ isLoading: true });
    return this._userApiService.create(userData).pipe(
      take(1),
      tap({
        next: response => {
          const state = ctx.getState();
          state.allUsers.push(response.user);
          state.isLoading = false;
          ctx.patchState(state);
        },
        error: error => {
          this._errorHandler.showMessage(error);
        },
      })
    );
  }
}
