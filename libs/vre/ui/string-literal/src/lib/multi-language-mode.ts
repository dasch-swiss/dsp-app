import { signal, WritableSignal } from '@angular/core';

/**
 * How `app-multi-language-fields` shows a multilingual text: one language at a time under a row of language tabs, or
 * every language in its own field.
 */
export type MultiLanguageMode = 'one' | 'all';

/** Where the chosen mode is kept in this browser. */
const MODE_KEY = 'dsp-multi-language-mode';

function storedMode(): MultiLanguageMode {
  try {
    return localStorage.getItem(MODE_KEY) === 'all' ? 'all' : 'one';
  } catch {
    // Not readable, as in a private window.
    return 'one';
  }
}

/**
 * The mode every `app-multi-language-fields` follows, shared by the fields of a dialog and remembered in this browser:
 * one language at a time until someone picks all languages.
 */
export const MULTI_LANGUAGE_MODE: WritableSignal<MultiLanguageMode> = (() => {
  const mode = signal(storedMode());
  const set = mode.set.bind(mode);
  mode.set = (next: MultiLanguageMode) => {
    set(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // Not remembered; the mode still holds on this page.
    }
  };
  mode.update = fn => mode.set(fn(mode()));
  return mode;
})();
