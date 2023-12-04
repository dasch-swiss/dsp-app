import { NgModule } from '@angular/core';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsRouterPluginModule, RouterStateSerializer } from '@ngxs/router-plugin';
import { NgxsModule } from '@ngxs/store';
import { CurrentProjectState, ListsState, OntologiesState, ProjectsState, UserState } from './index';
import { DEVTOOLS_REDUX_CONFIG, LOGGER_CONFIG, OPTIONS_CONFIG } from './store.config';
import { CustomRouterStateSerializer } from './lib/router/router-state.serializer';
import { CurrentPageState } from './lib/current-page/current-page.state';

const STATE_MODULES = [
    UserState,
    ProjectsState,
    CurrentPageState,
    OntologiesState,
    CurrentProjectState,
    ListsState,
];

@NgModule({
    exports: [NgxsModule],
    imports: [
        NgxsModule.forRoot(STATE_MODULES, OPTIONS_CONFIG),
        NgxsReduxDevtoolsPluginModule.forRoot(DEVTOOLS_REDUX_CONFIG),
        NgxsLoggerPluginModule.forRoot(LOGGER_CONFIG),
        NgxsRouterPluginModule.forRoot(),
    ],
    providers: [{ provide: RouterStateSerializer, useClass: CustomRouterStateSerializer }],
})
export class NgxsStoreModule {}
