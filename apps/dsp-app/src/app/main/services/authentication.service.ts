import { Inject, Injectable } from '@angular/core';
import { ApiResponseError, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { CacheService } from '../cache/cache.service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ErrorHandlerService } from '../services/error-handler.service';
import { DatadogRumService } from './datadog-rum.service';
import { SessionService } from './session.service';

@Injectable({
    providedIn: 'root',
})
export class AuthenticationService {
    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _datadogRumService: DatadogRumService,
        private _errorHandler: ErrorHandlerService,
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

                // destroy cache
                this._cache.destroy();

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
