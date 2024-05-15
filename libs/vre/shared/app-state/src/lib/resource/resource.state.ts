import { Inject, Injectable } from '@angular/core';
import {
  Constants,
  KnoraApiConnection,
  ReadLinkValue,
  ReadProject,
  ReadResource,
  SystemPropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { ProjectApiService, UserApiService } from '@dasch-swiss/vre/shared/app-api';
import { Common, DspResource } from '@dasch-swiss/vre/shared/app-common';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { Action, State, StateContext, Store } from '@ngxs/store';
import { map, take, tap } from 'rxjs/operators';
import { ProjectsSelectors } from '../projects/projects.selectors';
import { UserSelectors } from '../user/user.selectors';
import {
  GetAttachedProjectAction,
  GetAttachedUserAction,
  LoadAnnotatedResourceAction,
  LoadResourceAction,
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
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
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
        state.attachedProjects[resourceIri].value.push(response.project);
        ctx.setState({
          ...state,
          isLoading: false,
        });

        return response.project;
      })
    );
  }

  @Action(LoadResourceAction)
  loadResource(ctx: StateContext<ReourceStateModel>, { resourceIri }: LoadResourceAction) {
    return this._dspApiConnection.v2.res.getResource(resourceIri).pipe(
      tap(response => {
        const state = ctx.getState();
        const res = new DspResource(response as ReadResource);
        res.resProps = Common.initProps(res.res);

        // gather system property information
        res.systemProps = res.res.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);
        ctx.setState({
          ...state,
          resource: res,
        });
      })
    );
  }
  @Action(LoadAnnotatedResourceAction)
  loadAnnotatedResource(ctx: StateContext<ReourceStateModel>, { regionIri }: LoadAnnotatedResourceAction) {
    return this._dspApiConnection.v2.res.getResource(regionIri).pipe(
      tap(response => {
        const res = new DspResource(response as ReadResource);
        res.resProps = Common.initProps(res.res);
        const annotatedRepresentationIri = (res.res.properties[Constants.IsRegionOfValue] as ReadLinkValue[])[0]
          .linkedResourceIri;
        this.store.dispatch(new LoadResourceAction(annotatedRepresentationIri));
      })
    );
  }
}
