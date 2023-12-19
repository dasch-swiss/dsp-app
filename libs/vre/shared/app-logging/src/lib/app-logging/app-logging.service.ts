import { inject, Injectable } from '@angular/core';
import {
  BuildTag,
  BuildTagToken,
  DspInstrumentationConfig,
  DspInstrumentationToken,
} from '@dasch-swiss/vre/shared/app-config';
import { datadogLogs, Logger } from '@datadog/browser-logs';
import { Observable } from 'rxjs';

import { first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AppLoggingService {
  private logger: Logger | undefined;
  private buildTag$: Observable<BuildTag> = inject(BuildTagToken);
  private config: DspInstrumentationConfig = inject(DspInstrumentationToken);

  constructor() {
    this.buildTag$.pipe(first()).subscribe(tag => {
      if (
        this.config.dataDog.enabled &&
        typeof this.config.dataDog.clientToken == 'string'
      ) {
        datadogLogs.init({
          clientToken: this.config.dataDog.clientToken,
          site: this.config.dataDog.site,
          service: this.config.dataDog.service,
          env: this.config.environment,
          version: tag.build_tag,
          forwardErrorsToLogs: true, // forwards console.error logs, uncaught exceptions and network errors to Datadog
          forwardConsoleLogs: [], // don't forward any logs (besides console.error - in previous setting) to Datadog
          useSecureSessionCookie: true,
        });
        datadogLogs.logger.setHandler(['console', 'http']);
        this.logger = datadogLogs.logger;
      }
    });
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
