import { Inject, Injectable } from '@angular/core';
import { datadogRum, RumFetchResourceEventDomainContext } from '@datadog/browser-rum';
import { DspInstrumentationToken } from '../declarations/dsp-api-tokens';
import { DspInstrumentationConfig } from '../declarations/dsp-instrumentation-config';

const { version: appVersion } = require('../../../../package.json');

@Injectable({
    providedIn: 'root'
})
export class DatadogRumService {

    constructor(
        @Inject(DspInstrumentationToken) private _dspInstrumentationConfig: DspInstrumentationConfig
    ) {
        if (this._dspInstrumentationConfig.dataDog.enabled) {
            datadogRum.init({
                applicationId: this._dspInstrumentationConfig.dataDog.applicationId,
                clientToken: this._dspInstrumentationConfig.dataDog.clientToken,
                site: this._dspInstrumentationConfig.dataDog.site,
                service: this._dspInstrumentationConfig.dataDog.service,
                env: this._dspInstrumentationConfig.environment,
                version: appVersion,
                sampleRate: 100,
                trackInteractions: true,
                beforeSend: (event, context) => {
                    // collect a RUM resource's response headers
                    if (event.type === 'resource' && event.resource.type === 'xhr') {
                        event.context = { ...event.context, responseHeaders: (context as RumFetchResourceEventDomainContext).response.body };
                    }
                },
            });
        }
    }

    setActiveUser(identifier: any, identifierType: 'iri' | 'email' | 'username'): void {
        if(datadogRum.getInternalContext().application_id) {
            datadogRum.setUser({
                id: identifier,
                identifierType: identifierType
            });
        }
    }

    removeActiveUser(): void {
        if(datadogRum.getInternalContext().application_id) {
            datadogRum.removeUser();
        }
    }
}
