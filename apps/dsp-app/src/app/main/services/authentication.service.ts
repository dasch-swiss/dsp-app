import { Inject, Injectable } from '@angular/core';
import { ApiResponseError, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { DatadogRumService } from './datadog-rum.service';
import { SessionService } from '@dasch-swiss/vre/shared/app-session';

@Injectable({
    providedIn: 'root',
})
export class AuthenticationService {
    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _applicationStateService: ApplicationStateService,
        private _datadogRumService: DatadogRumService,
        private _errorHandler: AppErrorHandler,
        private _session: SessionService
    ) {}

    /**
     * logout service
     */
    logout() {
        this._dspApiConnection.v2.auth.logout().subscribe(
            () => {
                // destroy session
                this._session.destroySession();

                // destroy application state
                this._applicationStateService.destroy();

                // reload the page
                window.location.reload();

                // remove active datadog user
                this._datadogRumService.removeActiveUser();
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }
}
