import { Params } from '@angular/router';
import { ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { DspAppConfig, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { Selector } from '@ngxs/store';
import { ConfigState } from '../config.state';
import { IKeyValuePairs } from '../model-interfaces';
import { RouterSelectors } from '../router/router.selector';
import { ResourceState } from './resource.state';
import { ReourceStateModel } from './resource.state-model';

export class ResourceSelectors {
  @Selector([ResourceState])
  static attachedUsers(state: ReourceStateModel): IKeyValuePairs<ReadUser> {
    return state.attachedUsers;
  }

  @Selector([ResourceState])
  static attachedProjects(state: ReourceStateModel): IKeyValuePairs<ReadProject> {
    return state.attachedProjects;
  }

  @Selector([ResourceState])
  static resource(state: ReourceStateModel): DspResource | null {
    return state.resource;
  }

  @Selector([ResourceState, ConfigState.getConfig, RouterSelectors.params])
  static resourceAttachedProject(
    state: ReourceStateModel,
    dspApiConfig: DspAppConfig,
    params: Params
  ): ReadProject | undefined {
    const resourceId = `${dspApiConfig.iriBase}/${params[`${RouteConstants.project}`]}/${params[`${RouteConstants.resource}`]}`;
    if (!state.attachedProjects[resourceId] || state.attachedProjects[resourceId]?.value?.length === 0) {
      return undefined;
    }

    const attachedProject = state.attachedProjects[resourceId].value.find(
      u => u.id === state.resource?.res.attachedToProject
    );
    return attachedProject;
  }
}
