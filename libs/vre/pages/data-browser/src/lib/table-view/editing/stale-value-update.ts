import { ApiResponseError, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { catchError, EMPTY, throwError } from 'rxjs';

/**
 * Whether a rejected value update means the value the user edited is no longer the current one.
 *
 * dsp-api answers an update whose value IRI it cannot find on the resource with a 404 —
 * `ValuesResponderV2` raises `NotFoundException("Resource <…> does not have value <…> as an object
 * of property <…>")`. Every successful update supersedes the value IRI it targeted, so in normal
 * use the one thing that produces this is somebody else having saved that value between the table
 * fetching the page and the user pressing save. That is precisely the concurrent edit REQ-4.10
 * describes.
 *
 * The status alone is the test. Matching the sentence would tie the table to wording dsp-api is
 * free to change, and the only other way to get a 404 out of this endpoint — a resource deleted
 * underneath the page — wants the same treatment anyway: reload the row and say the edit did not
 * land.
 */
export function isStaleValueRejection(error: unknown): boolean {
  return error instanceof ApiResponseError && error.status === 404;
}

/**
 * A connection whose value updates report a stale rejection to `onStale` instead of failing.
 *
 * The table edits a cell by mounting the resource editor's own `PropertyValueUpdateComponent`,
 * which is the entire point of the feature: the write path must not be forked. That component
 * subscribes to `updateValue` itself and rethrows whatever it gets, so there is no output, no
 * callback and no error channel for a host to listen on — the only seam between it and dsp-js is
 * the connection it injects. So the cell's injector hands it one whose `updateValue` is wrapped.
 *
 * `Object.create` rather than a spread or a hand-written façade: the endpoints are classes whose
 * methods live on the prototype and read `this`, so a spread would copy nothing and a façade would
 * have to re-declare every method the subtree might reach for. Shadowing one method on a throwaway
 * object leaves the other several dozen reaching the real instances by prototype lookup, and leaves
 * the real connection untouched for every other component in the application.
 *
 * Only `updateValue` is wrapped. `createValue` has no stale case — a value that does not exist yet
 * cannot have been superseded — and `PropertyValueAddComponent` already handles its own rejections.
 */
export function interceptStaleValueUpdates(connection: KnoraApiConnection, onStale: () => void): KnoraApiConnection {
  const updateValue = (resource: Parameters<KnoraApiConnection['v2']['values']['updateValue']>[0]) =>
    connection.v2.values.updateValue(resource).pipe(
      catchError((error: unknown) => {
        if (!isStaleValueRejection(error)) {
          // Left exactly as it was: the editor rethrows, the global handler puts dsp-api's own
          // reason on screen, and because nothing told the editor the save succeeded the cell
          // stays open holding what the user typed (REQ-4.9).
          return throwError(() => error);
        }

        onStale();
        // Swallowed rather than rethrown so the user gets one message — ours, which says the edit
        // was not applied and that the row has been reloaded — instead of that plus the global
        // handler's bare "not found", which would describe the failure without naming its cause.
        return EMPTY;
      })
    );

  const values = Object.assign(Object.create(connection.v2.values), { updateValue });
  const v2 = Object.assign(Object.create(connection.v2), { values });
  return Object.assign(Object.create(connection), { v2 }) as KnoraApiConnection;
}
