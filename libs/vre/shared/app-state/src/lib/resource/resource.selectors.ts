import { ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { Selector } from '@ngxs/store';
import { IKeyValuePairs } from '../model-interfaces';
import { ResourceState } from './resource.state';
import { ReourceStateModel } from './resource.state-model';

export class ResourceSelectors {
  @Selector([ResourceState])
  static showAllProps(state: ReourceStateModel): boolean {
    return state.showAllProps;
  }

  @Selector([ResourceState])
  static showAllComments(state: ReourceStateModel): boolean {
    return state.showAllComments;
  }

  @Selector([ResourceState])
  static isLoading(state: ReourceStateModel): boolean {
    return state.isLoading;
  }

  @Selector([ResourceState])
  static attachedUsers(state: ReourceStateModel): IKeyValuePairs<ReadUser> {
    return state.attachedUsers;
  }

  @Selector([ResourceState])
  static attachedProjects(state: ReourceStateModel): IKeyValuePairs<ReadProject> {
    return state.attachedProjects;
  }
}
