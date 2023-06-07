import { Inject, Injectable } from '@angular/core';
import {
    datadogRum,
    RumFetchResourceEventDomainContext,
} from '@datadog/browser-rum';
import {
    DspInstrumentationConfig,
    DspInstrumentationToken,
} from '@dasch-swiss/vre/shared/app-config';
import { Session, SessionService } from './session.service';
import { environment } from '@dsp-app/src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class DatadogRumService {
    constructor(
        @Inject(DspInstrumentationToken)
        private _c: DspInstrumentationConfig,
        private _s: SessionService
    ) {
        if (this._c.dataDog.enabled) {
            datadogRum.init({
                applicationId: this._c.dataDog.applicationId,
                clientToken: this._c.dataDog.clientToken,
                site: this._c.dataDog.site,
                service: this._c.dataDog.service,
                env: this._c.environment,
                version: environment.version,
                sessionSampleRate: 100,
                sessionReplaySampleRate: 100, // if not included, the default is 100
                trackResources: true,
                trackLongTasks: true,
                trackUserInteractions: true,
                trackFrustrations: true,
                useSecureSessionCookie: true,
                beforeSend: (event, context) => {
                    // collect a RUM resource's response headers
                    if (
                        event.type === 'resource' &&
                        event.resource.type === 'xhr'
                    ) {
                        event.context = {
                            ...event.context,
                            responseHeaders: (
                                context as RumFetchResourceEventDomainContext
                            ).response?.body,
                        };
                    }
                },
            });

            // if session is valid: setActiveUser
            this._s.isSessionValid().subscribe((response: boolean) => {
                if (response) {
                    const session: Session = this._s.getSession();
                    this.setActiveUser(session.user.name, 'username');
                }
            });
        }
    }

    setActiveUser(
        identifier: any,
        identifierType: 'iri' | 'email' | 'username'
    ): void {
        if (datadogRum.getInternalContext().application_id) {
            datadogRum.setUser({
                id: identifier,
                identifierType: identifierType,
            });
        }
    }

    removeActiveUser(): void {
        if (datadogRum.getInternalContext().application_id) {
            datadogRum.removeUser();
        }
    }
}
