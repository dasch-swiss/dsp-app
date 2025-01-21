import { Params } from '@angular/router';
import { ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { DspAppConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { Selector } from '@ngxs/store';
import { ConfigState } from '../config.state';
import { IKeyValuePairs } from '../model-interfaces';
import { RouterSelectors } from '../router/router.selector';
import { ResourceState } from './resource.state';
import { ResourceStateModel } from './resource.state-model';

export class ResourceSelectors {
  @Selector([ResourceState])
  static attachedUsers(state: ResourceStateModel): IKeyValuePairs<ReadUser> {
    return state.attachedUsers;
  }

  @Selector([ResourceState])
  static attachedProjects({ attachedProjects }: ResourceStateModel): IKeyValuePairs<ReadProject> {
    return Object.keys(attachedProjects)
      .filter(key => attachedProjects[key] && Object.values(attachedProjects[key]).length > 0)
      .reduce((acc, key) => ({ ...acc, [key]: attachedProjects[key] }), {} as IKeyValuePairs<ReadProject>);
  }

  @Selector([ResourceState])
  static resource(state: ResourceStateModel): DspResource | null {
    return state.resource;
  }

  @Selector([ResourceState, ConfigState.getConfig, RouterSelectors.params])
  static resourceAttachedProject(
    state: ResourceStateModel,
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
