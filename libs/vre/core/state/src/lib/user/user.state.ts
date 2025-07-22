import { Injectable } from '@angular/core';
import { Constants, ReadUser } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { Action, State, StateContext } from '@ngxs/store';
import { map, take } from 'rxjs';
import { LoadUserAction, LogUserOutAction, SetUserAction, SetUserProjectGroupsAction } from './user.actions';
import { UserStateModel } from './user.state-model';

const defaults = <UserStateModel>{
  isLoading: false, // loading state
  user: null, // the currently logged in user
  userProjectAdminGroups: [], // users permission groups
  userProjectGroups: [], // users project groups
  isMemberOfSystemAdminGroup: false, // current user is system admin
  usersLoading: false, // loading state for all users
};

/*
  Provides data about the currently logged-in user, other users, and user permission groups.
  It also offers methods to load, create, update, and delete users in storage.
*/
@State<UserStateModel>({
  defaults,
  name: 'user',
})
@Injectable()
export class UserState {
  constructor(private _userApiService: UserApiService) {}

  @Action(LoadUserAction)
  loadUser(ctx: StateContext<UserStateModel>, { identifier, idType }: LoadUserAction) {
    ctx.patchState({ isLoading: true });
    return this._userApiService.get(identifier, idType).pipe(
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

  @Action(SetUserAction)
  setUser(ctx: StateContext<UserStateModel>, { user }: SetUserAction) {
    if (!user) return;

    const state = ctx.getState();

    if ((<ReadUser>state.user).id === user.id) {
      state.user = user;
    }

    ctx.setState({ ...state, isLoading: false });
    ctx.dispatch([new SetUserProjectGroupsAction(user)]);
  }

  @Action(SetUserProjectGroupsAction)
  setUserProjectGroupsData(ctx: StateContext<UserStateModel>, { user }: SetUserProjectGroupsAction) {
    let isMemberOfSystemAdminGroup = false;
    const userProjectGroups: string[] = [];
    const userProjectAdminGroups: string[] = [];

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
          // projectAdmin + projectMember
          userProjectAdminGroups.push(key);
          userProjectGroups.push(key);
        } else {
          // projectMember
          userProjectGroups.push(key);
        }
      }
    }

    const state = ctx.getState();
    if (state.user?.username === user.username) {
      state.userProjectAdminGroups = userProjectAdminGroups;
      state.userProjectGroups = userProjectGroups;
      state.isMemberOfSystemAdminGroup = isMemberOfSystemAdminGroup;
    }

    ctx.setState({ ...state });
  }

  @Action(LogUserOutAction)
  logUserOut(ctx: StateContext<UserStateModel>) {
    ctx.setState(defaults);
  }
}
