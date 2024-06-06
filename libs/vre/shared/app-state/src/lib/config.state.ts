// state/config.state.ts
import { Injectable } from '@angular/core';
import { DspAppConfig } from '@dasch-swiss/vre/shared/app-config';
import { State, Action, StateContext, Selector } from '@ngxs/store';

export class SetConfigAction {
  static readonly type = '[Config] Set';
  constructor(public configStateModel: ConfigStateModel) {}
}

export interface ConfigStateModel {
  dspAppConfig: DspAppConfig;
}

@State<ConfigStateModel>({
  name: 'config',
  defaults: {
    dspAppConfig: {} as DspAppConfig,
  },
})
@Injectable()
export class ConfigState {
  @Action(SetConfigAction)
  setConfig(ctx: StateContext<ConfigStateModel>, action: SetConfigAction) {
    ctx.setState(action.configStateModel);
  }

  @Selector([ConfigState])
  static getConfig(state: ConfigStateModel): DspAppConfig {
    return state.dspAppConfig;
  }
}
