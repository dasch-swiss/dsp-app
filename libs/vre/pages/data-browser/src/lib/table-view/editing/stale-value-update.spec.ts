import { ApiResponseError, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { interceptStaleValueUpdates, isStaleValueRejection } from './stale-value-update';

function apiError(status: number): ApiResponseError {
  const error = new ApiResponseError();
  error.status = status;
  return error;
}

/**
 * A stand-in for the real connection. `Object.create` is what the interceptor uses to shadow a
 * single method, so the fake mirrors the real shape — nested endpoint objects whose methods the
 * interceptor must reach through a prototype chain — rather than a flat literal.
 */
function fakeConnection(updateValue: () => Observable<unknown>) {
  const values = { updateValue, createValue: () => of('created'), marker: 'real-values' };
  const v2 = { values, res: { marker: 'real-res' } };
  return { v2, admin: { marker: 'real-admin' } } as unknown as KnoraApiConnection;
}

describe('isStaleValueRejection', () => {
  it('recognises the 404 dsp-api answers when the value is no longer on the resource', () => {
    expect(isStaleValueRejection(apiError(404))).toBe(true);
  });

  it('does not claim an ordinary rejection is a concurrent edit', () => {
    // A 400 is the user's own mistake — an invalid value, a broken constraint. Treating it as a
    // concurrent edit would reload the row and throw away what they typed for no reason.
    expect(isStaleValueRejection(apiError(400))).toBe(false);
    expect(isStaleValueRejection(apiError(403))).toBe(false);
    expect(isStaleValueRejection(new Error('boom'))).toBe(false);
  });
});

describe('interceptStaleValueUpdates', () => {
  it('leaves every other endpoint reachable', () => {
    const connection = fakeConnection(() => of('written'));
    const decorated = interceptStaleValueUpdates(connection, () => undefined);

    // The whole point of shadowing one method on a throwaway object: everything else must still
    // resolve to the real instance, or the editor subtree loses endpoints it reaches for.
    expect(decorated.admin).toBe(connection.admin);
    expect(decorated.v2.res).toBe(connection.v2.res);
    expect(decorated.v2.values.createValue).toBe(connection.v2.values.createValue);
  });

  it('passes a successful update straight through', async () => {
    const onStale = jest.fn();
    const decorated = interceptStaleValueUpdates(
      fakeConnection(() => of('written')),
      onStale
    );

    await expect(firstValueFrom(decorated.v2.values.updateValue({} as never))).resolves.toBe('written');
    expect(onStale).not.toHaveBeenCalled();
  });

  it('rethrows an ordinary rejection so the editor keeps the cell open and the error is surfaced', async () => {
    const onStale = jest.fn();
    const rejection = apiError(400);
    const decorated = interceptStaleValueUpdates(
      fakeConnection(() => throwError(() => rejection)),
      onStale
    );

    await expect(firstValueFrom(decorated.v2.values.updateValue({} as never))).rejects.toBe(rejection);
    expect(onStale).not.toHaveBeenCalled();
  });

  it('reports a stale rejection and completes without an error', async () => {
    const onStale = jest.fn();
    const decorated = interceptStaleValueUpdates(
      fakeConnection(() => throwError(() => apiError(404))),
      onStale
    );

    // Completing empty rather than erroring is what keeps the editor from rethrowing: the user
    // gets one message, the one naming the concurrent edit, instead of that plus a bare 404.
    const emissions: unknown[] = [];
    let errored = false;
    decorated.v2.values.updateValue({} as never).subscribe({
      next: value => emissions.push(value),
      error: () => {
        errored = true;
      },
    });

    expect(onStale).toHaveBeenCalledTimes(1);
    expect(emissions).toEqual([]);
    expect(errored).toBe(false);
  });
});
