import { Inject, Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import {
    LogUserOutAction,
    LoadUserAction,
    LoadUsersAction,
    ResetUsersAction as ResetUsersAction,
    CreateUserAction,
    SetUserAction,
    RemoveUserAction,
    LoadUserContentByIriAction,
    SetUserProjectGroupsAction,
} from './user.actions';
import { UserStateModel } from './user.state-model';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ApiResponseData, ApiResponseError, Constants, KnoraApiConnection, ReadUser, User, UserResponse, UsersResponse } from '@dasch-swiss/dsp-js';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { SetProjectMemberAction } from '../projects/projects.actions';

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
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: AppErrorHandler
    ) {}

    @Action(LoadUserAction)
    loadUser(
        ctx: StateContext<UserStateModel>,
        { username }: LoadUserAction
    ) {
        ctx.patchState({ isLoading: true });
        return this._dspApiConnection.admin.usersEndpoint
            .getUserByUsername(username)
            .pipe(
                take(1),
                map((response:
                            | ApiResponseData<UserResponse>
                            | ApiResponseError
                    ) => {
                        if (response instanceof ApiResponseData) {
                            ctx.setState({ ...ctx.getState(), isLoading: false, user: response.body.user });
                            ctx.dispatch(new SetUserProjectGroupsAction(response.body.user));
                            return response.body.user;
                        } else {
                            console.error(response);
                            return new User;
                        }
                })
            )
    }

    @Action(LoadUserContentByIriAction)
    loadUserContentByIriAction(
        ctx: StateContext<UserStateModel>,
        { iri }: LoadUserContentByIriAction
    ) {
        ctx.patchState({ isLoading: true });
        return this._dspApiConnection.admin.usersEndpoint.getUserByIri(iri)
            .pipe(
                take(1),
                map((response: ApiResponseData<UserResponse> | ApiResponseError) => { 
                    return response as ApiResponseData<UserResponse>;
                }),
                tap({
                    next: (responseUser: ApiResponseData<UserResponse>) => {
                        const state = ctx.getState();
                        const userIndex = state.allUsers.findIndex(u => u.id === responseUser.body.user.id)
                        if (userIndex > -1) {
                            state.allUsers[userIndex] = responseUser.body.user;
                        }

                        ctx.setState({ 
                            ...state, 
                            isLoading: false,
                        });
                    },
                    error: (error: ApiResponseError) => {
                        this._errorHandler.showMessage(error);
                    }
                })
            );
    }

    @Action(SetUserAction)
    setUser(ctx: StateContext<UserStateModel>,
        { user }: SetUserAction
    ) {
        const state = ctx.getState();
        const userIndex = state.allUsers.findIndex(u => u.id === user.id);
        if (userIndex > -1) {
            state.allUsers[userIndex] = user;
        }
        
        if ((<ReadUser>state.user).id === user.id) {
            state.user = user;
        }

        ctx.setState({ ...state, isLoading: false });
        ctx.dispatch([
            new SetUserProjectGroupsAction(user),
            new SetProjectMemberAction(user)
        ]);
    }
    
    @Action(RemoveUserAction)
    removeUser(ctx: StateContext<UserStateModel>,
        { user }: RemoveUserAction
    ) {
        const state = ctx.getState();
        state.allUsers.splice(state.allUsers.findIndex(u => u.id === user.id), 1);
        
        ctx.setState({ ...state, isLoading: false });
    }

    @Action(SetUserProjectGroupsAction)
    setUserProjectGroupsData(ctx: StateContext<UserStateModel>,
        { user }: SetUserProjectGroupsAction
    ) {
        let isMemberOfSystemAdminGroup = false;
        const userProjectGroups: string[] = [];

        // get permission information: a) is user sysadmin? b) get list of project iri's where user is project admin
        const groupsPerProject = user.permissions.groupsPerProject;

        if (groupsPerProject) {
            const groupsPerProjectKeys: string[] = Object.keys(groupsPerProject);

            for (const key of groupsPerProjectKeys) {
                if (key === Constants.SystemProjectIRI) {
                    //is sysAdmin
                    isMemberOfSystemAdminGroup = groupsPerProject[key].indexOf(Constants.SystemAdminGroupIRI) > -1;
                }

                if (groupsPerProject[key].indexOf(Constants.ProjectAdminGroupIRI) > -1) {
                    //projectAdmin
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
        return of(ctx.getState()).pipe(
            map(currentState => {
               ctx.setState(defaults);
               return currentState;
            })
        );
    }

    @Action(LoadUsersAction)
    loadUsersAction(
        ctx: StateContext<UserStateModel>,
        { loadFullUserData }: LoadUsersAction
    ) {
        ctx.patchState({ isLoading: true });
        return this._dspApiConnection.admin.usersEndpoint.getUsers()
            .pipe(
                take(1),
                map((response: ApiResponseData<UsersResponse> | ApiResponseError) => {
                    return response as ApiResponseData<UsersResponse>;
                }),
                tap({
                    next: (response: ApiResponseData<UsersResponse>) => {
                        ctx.setState({ 
                            ...ctx.getState(), 
                            allUsers: response.body.users
                        });

                        if (loadFullUserData) {
                            response.body.users.map(u => ctx.dispatch(new LoadUserContentByIriAction(u.id)));
                        }
                    },
                    error: (error) => {
                        this._errorHandler.showMessage(error);
                    }
                })
            );
    }

    @Action(ResetUsersAction)
    resetUsers(ctx: StateContext<UserStateModel>) {
        ctx.patchState({ allUsers: defaults.allUsers });
    }

    @Action(CreateUserAction)
    createUserAction(
        ctx: StateContext<UserStateModel>,
        { userData }: CreateUserAction
    ) {
        ctx.patchState({ isLoading: true });
        return this._dspApiConnection.admin.usersEndpoint.createUser(userData)
            .pipe(
                take(1),
                map((response: ApiResponseData<UserResponse> | ApiResponseError) => {
                    return response as ApiResponseData<UserResponse>;
                }),
                tap({
                    next: (response: ApiResponseData<UserResponse>) => {
                        const state = ctx.getState()
                        state.allUsers.push(response.body.user);
                        state.isLoading = false;
                        ctx.patchState(state);
                    },
                    error: (error) => {
                        this._errorHandler.showMessage(error);
                    }
                })
            );
    }
}
