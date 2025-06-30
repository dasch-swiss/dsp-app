import { ListNodeInfo } from '@dasch-swiss/dsp-js';
import { Selector } from '@ngxs/store';
import { ListsState } from './lists.state';
import { ListsStateModel } from './lists.state-model';

export class ListsSelectors {
  @Selector([ListsState])
  static isListsLoading(state: ListsStateModel): boolean {
    return state.isLoading;
  }

  @Selector([ListsState])
  static isListsLoaded(state: ListsStateModel): boolean {
    return state.isLoaded;
  }

  @Selector([ListsState])
  static listsInProject(state: ListsStateModel): ListNodeInfo[] {
    return state.listsInProject;
  }
}
