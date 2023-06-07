import { Inject, Injectable } from '@angular/core';
import { datadogLogs, Logger } from '@datadog/browser-logs';
import {
    DspInstrumentationConfig,
    DspInstrumentationToken,
} from '@dasch-swiss/vre/shared/app-config';

@Injectable({
    providedIn: 'root',
})
export class AppLoggingService {
    private logger: Logger | undefined;
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
            datadogLogs.logger.setHandler(['console', 'http']);
            this.logger = datadogLogs.logger;
        }
    }

    debug(message: string, messageContext?: object, error?: Error) {
        if (typeof this.logger != 'undefined') {
            datadogLogs.logger.debug(message, messageContext, error);
        } else {
            console.debug(message, messageContext, error);
        }
    }

    info(message: string, messageContext?: object, error?: Error) {
        if (typeof this.logger != 'undefined') {
            this.logger.info(message, messageContext, error);
        } else {
            console.info(message, messageContext, error);
        }
    }
    warn(message: string, messageContext?: object, error?: Error) {
        if (typeof this.logger != 'undefined') {
            this.logger.warn(message, messageContext, error);
        } else {
            console.warn(message, messageContext, error);
        }
    }
    error(message: string, messageContext?: any, error?: Error) {
        if (typeof this.logger != 'undefined') {
            this.logger.error(message, messageContext, error);
        } else {
            console.error(message, messageContext, error);
        }
    }
}
