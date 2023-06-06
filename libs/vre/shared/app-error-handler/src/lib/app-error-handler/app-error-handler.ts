import { ErrorHandler } from '@angular/core';

export class AppErrorHandler implements ErrorHandler {
    /**
     * Logs out the error to the console.
     * The AppLogsService is configured in such a way to catch errors printed
     * to the console and forward them to DataDog.
     * @param err the error to log.
     */
    handleError(err: any): void {
        console.error(err.originalError || err);
    }
}
