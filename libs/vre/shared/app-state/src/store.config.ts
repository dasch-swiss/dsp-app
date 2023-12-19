import { NgxsDevtoolsOptions } from '@ngxs/devtools-plugin/src/symbols';
import { NgxsLoggerPluginOptions } from '@ngxs/logger-plugin/src/symbols';
import { NgxsConfig } from '@ngxs/store/src/symbols';

export const OPTIONS_CONFIG: Partial<NgxsConfig> = {
  /**
   * Run in development mode. This will add additional debugging features:
   * - Object.freeze on the state and actions to guarantee immutability
   * todo: you need set production mode
   * import { environment } from '@env';
   * developmentMode: !environment.production
   */
  // Currently disable as this breakes matDialog opening for components saved in state
  // developmentMode: !environment.production,
  selectorOptions: {
    injectContainerState: false,
    // These Selector Settings are recommended in preparation for NGXS v4
    // (See above for their effects)
    suppressErrors: false,
  },
};

export const DEVTOOLS_REDUX_CONFIG: NgxsDevtoolsOptions = {
  /**
   * Whether the dev tools is enabled or note. Useful for setting during production.
   * todo: you need set production mode
   * import { environment } from '@env';
   *
   */
  disabled: false, //environment.production
};

export const LOGGER_CONFIG: NgxsLoggerPluginOptions = {
  /**
   * Disable the logger. Useful for prod mode..
   * todo: you need set production mode
   * import { environment } from '@env';
   * disabled: environment.production
   */
  // disabled: environment.production,
  disabled: true,
};
