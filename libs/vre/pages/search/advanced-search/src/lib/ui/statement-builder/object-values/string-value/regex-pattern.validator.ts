import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Java-only syntax that JavaScript's `RegExp` rejects although dsp-api accepts it: inline flags and
 * atomic groups (`(?i)`, `(?-i)`, `(?>…)`) and possessive quantifiers (`a*+`, `a++`, `a?+`, `a{2}+`).
 * A pattern using them is left to dsp-api, which answers an invalid one with a 400 the failure panel
 * shows, rather than refused here for a pattern the API would have run.
 */
const JAVA_ONLY_SYNTAX = /\(\?[a-zA-Z>-]|[*+?}]\+/;

/**
 * Whether the "is like" value is a pattern the regex engine can compile. dsp-api validates it with
 * `java.util.regex` (dsp-api#4368) and the value reaches it as typed, so a glob-style `*MAL*` is
 * rejected with "Dangling meta character '*'" — but only after the filter is confirmed and searched
 * (DEV-7441). Checked with JavaScript's `RegExp`, which agrees with Java on everything outside
 * {@link JAVA_ONLY_SYNTAX}.
 */
export function isCompilableRegex(pattern: string): boolean {
  if (JAVA_ONLY_SYNTAX.test(pattern)) {
    return true;
  }
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rejects an "is like" value that is not a valid regular expression (see {@link isCompilableRegex}).
 * The value is embedded in the Gravsearch `regex()` FILTER by `escapeForGravsearchStringLiteral` in
 * `model.ts`, which escapes only the string layers and leaves regex syntax to the user.
 */
export function regexPatternValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (typeof value !== 'string' || value === '') {
      return null;
    }
    return isCompilableRegex(value) ? null : { invalidRegex: true };
  };
}
