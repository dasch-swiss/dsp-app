import { signal, WritableSignal } from '@angular/core';

/**
 * A signal remembered in this browser under `key`: it starts from what was stored, or `initial`, and stores each value
 * set. Storage may be missing or full, as in a private window; the value then still holds on the page.
 */
export function rememberedSignal<T>(
  key: string,
  initial: T,
  parse: (stored: string) => T | undefined
): WritableSignal<T> {
  let start = initial;
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) start = parse(stored) ?? initial;
  } catch {
    // Not readable; start from `initial`.
  }
  const value = signal(start);
  const set = value.set.bind(value);
  value.set = (next: T) => {
    set(next);
    try {
      localStorage.setItem(key, typeof next === 'string' ? next : JSON.stringify(next));
    } catch {
      // Not remembered; the value still holds on this page.
    }
  };
  value.update = (fn: (current: T) => T) => value.set(fn(value()));
  return value;
}
