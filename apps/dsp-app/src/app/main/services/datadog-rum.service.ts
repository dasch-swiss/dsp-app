import { inject, Injectable } from '@angular/core';
import {
    datadogRum,
    RumFetchResourceEventDomainContext,
} from '@datadog/browser-rum';
import {
    BuildTag,
    BuildTagToken,
    DspInstrumentationConfig,
    DspInstrumentationToken,
} from '@dasch-swiss/vre/shared/app-config';
import { Session, SessionService } from './session.service';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class DatadogRumService {
    private buildTag$: Observable<BuildTag> = inject(BuildTagToken);
    private config: DspInstrumentationConfig = inject(DspInstrumentationToken);
    private session = inject(SessionService);
    constructor() {
        this.buildTag$.pipe(first()).subscribe((tag) => {
            if (this.config.dataDog.enabled) {
                datadogRum.init({
                    applicationId: this.config.dataDog.applicationId,
                    clientToken: this.config.dataDog.clientToken,
                    site: this.config.dataDog.site,
                    service: this.config.dataDog.service,
                    env: this.config.environment,
                    version: tag.build_tag,
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
                this.session.isSessionValid().subscribe((response: boolean) => {
                    if (response) {
                        const session: Session = this.session.getSession();
                        this.setActiveUser(session.user.name, 'username');
                    }
                });
            }
        });
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
