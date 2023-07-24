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
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { Session, SessionService } from '@dasch-swiss/vre/shared/app-session';
import { v5 as uuidv5 } from 'uuid';

@Injectable({
    providedIn: 'root',
})
export class DatadogRumService {
    private buildTag$: Observable<BuildTag> = inject(BuildTagToken);
    private config: DspInstrumentationConfig = inject(DspInstrumentationToken);
    private session: SessionService = inject(SessionService);
    constructor() {
        this.buildTag$.pipe(first()).subscribe((tag) => {
            if (
                this.config.dataDog.enabled &&
                this.config.dataDog.applicationId &&
                this.config.dataDog.clientToken
            ) {
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
                // FIXME: so that updates to the session state are reflected in the specified user
                this.session.isSessionValid().subscribe((response: boolean) => {
                    if (response) {
                        const session: Session | null =
                            this.session.getSession();
                        if (session?.user?.name) {
                            const id: string = uuidv5(
                                session.user.name,
                                uuidv5.URL
                            );
                            this.setActiveUser(id);
                        } else {
                            this.removeActiveUser();
                        }
                    }
                });
            }
        });
    }

    setActiveUser(identifier: string): void {
        if (datadogRum.getInternalContext()?.application_id) {
            datadogRum.setUser({
                id: identifier,
            });
        }
    }

    removeActiveUser(): void {
        if (datadogRum.getInternalContext()?.application_id) {
            datadogRum.removeUser();
        }
    }
}
