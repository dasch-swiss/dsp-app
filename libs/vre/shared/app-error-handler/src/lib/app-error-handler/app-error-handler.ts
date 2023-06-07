import { ErrorHandler, Injector } from '@angular/core';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';
import { HttpErrorResponse } from '@angular/common/http';

export class AppErrorHandler implements ErrorHandler {
    constructor(private _injector: Injector) {}

    /**
     * Logs out the error using the logging service.
     * @param error the error to log.
     */
    handleError(error: Error): void {
        const logger = this._injector.get(AppLoggingService);

        if (error instanceof HttpErrorResponse) {
            // HTTP related error
            logger.error('Caught HttpErrorResponse error', error);
        } else if (
            error instanceof TypeError ||
            error instanceof ReferenceError
        ) {
            // Runtime exceptions mostly induced by Developer's code
            logger.error('Caught Type or Reference error', error);
        } else {
            // catch-all: catch rest of errors
            logger.error('Caught error', error);
        }
    }
}
