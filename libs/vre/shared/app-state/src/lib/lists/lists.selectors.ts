import { Selector } from '@ngxs/store';
import { ListNodeInfo } from '@dasch-swiss/dsp-js';
import { ListsStateModel } from './lists.state-model';
import { ListsState } from './lists.state';

export class ListsSelectors {
    @Selector([ListsState])
    static isListsLoading(state: ListsStateModel): boolean {
        return state.isLoading;
    }

    @Selector([ListsState])
    static listsInProject(state: ListsStateModel): ListNodeInfo[] {
        return state.listsInProject;
    }
}
