import { Selector } from '@ngxs/store';
import { CurrentPageState } from './current-page.state';
import { CurrentPageStateModel } from './current-page.state-model';

export class CurrentPageSelectors {
    @Selector([CurrentPageState])
    static page(state: CurrentPageStateModel): string {
        return state.page;
    }

    @Selector([CurrentPageState])
    static appInit(state: CurrentPageStateModel): boolean {
        return state.appInit;
    }

    @Selector([CurrentPageState])
    static loginReturnLink(state: CurrentPageStateModel): string {
        return state?.loginReturnLink != null ? state.loginReturnLink : '';
    }
}
