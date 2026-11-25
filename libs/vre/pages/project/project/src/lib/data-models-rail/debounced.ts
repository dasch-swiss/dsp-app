import { Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

/** How long typing pauses before a search runs: a big data model redraws its rows once, not on every key. */
const SEARCH_DEBOUNCE_MS = 200;

/** `source`, taking a new value only once it has stayed the same for `ms`. Call in an injection context. */
export function debounced<T>(source: Signal<T>, ms = SEARCH_DEBOUNCE_MS): Signal<T> {
  return toSignal(toObservable(source).pipe(debounceTime(ms)), { initialValue: source() });
}
