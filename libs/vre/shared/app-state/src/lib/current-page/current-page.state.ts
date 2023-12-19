import { Injectable } from '@angular/core';
import { Action, State, StateContext, Store, Select } from '@ngxs/store';
import {
  AppInitAction,
  ReloadCurrentPageAction,
  SetCurrentPageAction,
  SetLoginReturnLinkAction,
} from './current-page.actions';
import { CurrentPageStateModel } from './current-page.state-model';

const defaults: CurrentPageStateModel = {
  appInit: false,
  loginReturnLink: '',
  page: '',
};

@State<CurrentPageStateModel>({
  defaults,
  name: 'currentPage',
})
@Injectable()
export class CurrentPageState {
  constructor(private store: Store) {}

  @Action(SetCurrentPageAction)
  setCurrentPage(ctx: StateContext<CurrentPageStateModel>, { page }: SetCurrentPageAction) {
    ctx.setState({ ...ctx.getState(), page });
    ctx.patchState({ page });
  }

  @Action(ReloadCurrentPageAction)
  reloadCurrentPage(ctx: StateContext<CurrentPageStateModel>) {
    ctx.dispatch(new SetCurrentPageAction(this.store.snapshot().currentPage.page));
  }

  @Action(AppInitAction)
  appInitAction(ctx: StateContext<CurrentPageStateModel>) {
    ctx.patchState({ appInit: true });
  }

  @Action(SetLoginReturnLinkAction)
  setReturnLink(ctx: StateContext<CurrentPageStateModel>, { loginReturnLink }: SetLoginReturnLinkAction) {
    ctx.patchState({
      loginReturnLink: loginReturnLink.replace(new RegExp('^/[a-z]{2}-[A-Z]{2}'), ''),
    });
  }
}
