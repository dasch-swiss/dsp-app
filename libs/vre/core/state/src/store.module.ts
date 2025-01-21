import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsRouterPluginModule, RouterStateSerializer } from '@ngxs/router-plugin';
import { NgxsModule, Store } from '@ngxs/store';
import { CustomRouterStateSerializer } from './lib/router/router-state.serializer';
import { DEVTOOLS_REDUX_CONFIG, LOGGER_CONFIG, OPTIONS_CONFIG } from './store.config';
import {
  ConfigState,
  ListsState,
  OntologiesState,
  OntologyClassState,
  ProjectsState,
  ResourceState,
  SetConfigAction,
  UserState,
} from './index';

export function initializeConfigState(configService: AppConfigService, store: Store) {
  return () => store.dispatch(new SetConfigAction(configService));
}

const STATE_MODULES = [
  UserState,
  ProjectsState,
  OntologiesState,
  ListsState,
  OntologyClassState,
  ResourceState,
  ConfigState,
];

@NgModule({
  exports: [NgxsModule],
  imports: [
    NgxsModule.forRoot(STATE_MODULES, OPTIONS_CONFIG),
    NgxsReduxDevtoolsPluginModule.forRoot(DEVTOOLS_REDUX_CONFIG),
    NgxsLoggerPluginModule.forRoot(LOGGER_CONFIG),
    NgxsRouterPluginModule.forRoot(),
  ],
  providers: [
    { provide: RouterStateSerializer, useClass: CustomRouterStateSerializer },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeConfigState,
      deps: [AppConfigService, Store],
      multi: true,
    },
  ],
})
export class NgxsStoreModule {}
