import * as Rollbar from 'rollbar';

import { Injectable, InjectionToken, ErrorHandler } from '@angular/core';

import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';

export const RollbarService = new InjectionToken<Rollbar>('rollbar');

@Injectable()
export class RollbarErrorHandler implements ErrorHandler {
    public rollbar: Rollbar;

    constructor(private _appInitService: AppConfigService) {
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
