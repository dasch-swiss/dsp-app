import { Observable, of, throwError } from 'rxjs';
import { AjaxError, AjaxResponse } from 'rxjs/ajax';
import { retry, timer } from 'rxjs';

/**
 *
 * Retries failed HTTP requests.
 *
 * @param delayMs delay in milliseconds before the request is retried.
 * @param maxRetries maximum number of retries.
 * @param retryOnErrorStatus HTTP error status codes for which the request is retried.
 * @param logError if true, error is written to the console error log.
 *
 * @category Internal
 */
export function retryOnError(delayMs: number, maxRetries: number, retryOnErrorStatus: number[], logError: boolean) {
  let retries = maxRetries;

  // inspired by https://medium.com/angular-in-depth/retry-failed-http-requests-in-angular-f5959d486294
  return (src: Observable<AjaxResponse<any>>): Observable<AjaxResponse<any>> =>
    src.pipe(
      retry({
        count: maxRetries,
        delay: (error: AjaxError, retryCount: number) => {
          if (retryOnErrorStatus.indexOf(error.status) !== -1) {
            if (logError)
              console.error('HTTP request failed:', 'status:', error.status, 'retries:', retryCount, 'error:', error);
            return timer(delayMs);
          } else {
            throw error;
          }
        },
      })
    );
}
