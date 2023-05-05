import * as Rollbar from 'rollbar';

import {
    Injectable,
    Inject,
    InjectionToken,
    ErrorHandler,
} from '@angular/core';

import { AppInitService } from './app-init.service';

export const RollbarService = new InjectionToken<Rollbar>('rollbar');

@Injectable()
export class RollbarErrorHandler implements ErrorHandler {
    public rollbar: Rollbar;

    constructor(
        @Inject(AppInitService) private _appInitService: AppInitService
    ) {
        this.rollbar = new Rollbar({
            accessToken:
                this._appInitService.dspInstrumentationConfig.rollbar
                    .accessToken,
            enabled:
                this._appInitService.dspInstrumentationConfig.rollbar.enabled,
            environment:
                this._appInitService.dspInstrumentationConfig.environment,
            captureUncaught: true,
            captureUnhandledRejections: true,
            nodeSourceMaps: false,
            inspectAnonymousErrors: true,
            ignoreDuplicateErrors: true,
            wrapGlobalEventHandlers: false,
            scrubRequestBody: true,
            exitOnUncaughtException: false,
            stackTraceLimit: 20,
        });
    }

    handleError(err: any): void {
        this.rollbar.error(err.originalError || err);
    }
}
