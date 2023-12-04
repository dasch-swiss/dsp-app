import { Observable, of } from 'rxjs';
import { computed, Signal } from '@angular/core';
import { catchError, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * Converts an observable to a signal with an error signal
 * @param obs$
 * @returns {value: Signal<T | undefined>; error: Signal<E | undefined>}
 */
export function toSignalsWithErrors<T, E>(
    obs$: Observable<T>
): {
    value: Signal<T | undefined>;
    error: Signal<E | undefined>;
} {
    const source = toSignal(
        obs$.pipe(
            map((v: T) => ({ value: v, error: undefined })),
            catchError((e: E) => of({ value: undefined, error: e }))
        )
    );

    const value = computed(() => source()?.value);
    const error = computed(() => source()?.error);

    return { value, error };
}
