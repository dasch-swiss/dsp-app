/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { ErrorHandler, inject } from '@angular/core';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';
import { HttpErrorResponse } from '@angular/common/http';

export class AppErrorHandler implements ErrorHandler {
    logger = inject(AppLoggingService);
    /**
     * Logs out the error using the logging service.
     * @param error the error to log.
     */
    handleError(error: Error): void {
        if (error instanceof HttpErrorResponse) {
            // HTTP related error
            this.logger.error('Caught HttpErrorResponse error', error);
        } else if (
            error instanceof TypeError ||
            error instanceof ReferenceError
        ) {
            // Runtime exceptions mostly induced by Developer's code
            this.logger.error('Caught Type or Reference error', error);
        } else {
            // catch-all: catch rest of errors
            this.logger.error('Caught error', error);
        }
    }
}
