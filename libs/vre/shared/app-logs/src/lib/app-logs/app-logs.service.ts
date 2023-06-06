import { Inject, Injectable } from '@angular/core';
import { datadogLogs } from '@datadog/browser-logs';
import {
    DspInstrumentationConfig,
    DspInstrumentationToken,
} from '@dasch-swiss/vre/shared/app-config';

@Injectable({
    providedIn: 'root',
})
export class AppLogsService {
    constructor(
        @Inject(DspInstrumentationToken) private c: DspInstrumentationConfig
    ) {
        if (c.dataDog.enabled && typeof c.dataDog.clientToken == 'string') {
            datadogLogs.init({
                clientToken: c.dataDog.clientToken,
                site: c.dataDog.site,
                service: c.dataDog.service,
                env: c.environment,
                forwardErrorsToLogs: true, // forwards console.error logs, uncaught exceptions and network errors to Datadog
                forwardConsoleLogs: [], // don't forward any logs (besides console.error - in previous setting) to Datadog
            });
        }
    }
}
