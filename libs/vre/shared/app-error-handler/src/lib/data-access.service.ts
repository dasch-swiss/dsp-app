import { inject, Injectable } from '@angular/core';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';

@Injectable({
    providedIn: 'root',
})
export class DataAccessService {
    dspApiConnection: KnoraApiConnection = inject(DspApiConnectionToken);

    getHealthStatus() {
        return this.dspApiConnection.system.healthEndpoint.getHealthStatus();
    }

    logout() {
        return this.dspApiConnection.v2.auth.logout();
    }
}
