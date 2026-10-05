import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * dsp-api rejects a search value shorter than this, whatever the endpoint:
 * "A search value is expected to have at least length of 3".
 */
export const MIN_SEARCH_TERM_LENGTH = 3;

// Two literals on purpose: `.test()` on a `/g` regex advances `lastIndex` between calls and would skip
// tokens, so the predicate uses the non-global one and only `.replace()` uses the global one.
const WILDCARD = /[*?]/;
const WILDCARDS_GLOBAL = /[*?]/g;

/**
 * The whole trimmed term must be at least {@link MIN_SEARCH_TERM_LENGTH} characters. The rule is on the
 * *whole* string, not per token — `buch de` passes even though `de` alone does not.
 *
 * This half holds on every search path (`/v2/search/:term` and Gravsearch `knora-api:matchFulltext`),
 * so it is the validator to reach for by default. An empty control is left to `Validators.required`.
 */
export function searchTermMinLengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const term = (control.value ?? '').trim();
    if (term === '') {
      return null;
    }
    return term.length < MIN_SEARCH_TERM_LENGTH
      ? { searchTermTooShort: { requiredLength: MIN_SEARCH_TERM_LENGTH } }
      : null;
  };
}

/**
 * Boolean operators that need a term after them (at the end of the term), and those that also need one
 * before them (at the start). Measured against the dev API: `foo AND`, `foo NOT`, `AND foo` and
 * `foo &&` are parse errors, while `NOT foo` and `foo AND bar` run. Lucene only reads them in uppercase,
 * so `foo and` is an ordinary term.
 */
const OPERATORS_NEEDING_A_TERM_AFTER = new Set(['AND', 'OR', 'NOT', '&&', '||']);
const OPERATORS_NEEDING_A_TERM_BEFORE = new Set(['AND', 'OR', '&&', '||']);

/**
 * Where a term stops in the middle of Lucene syntax, so dsp-api could only answer it with a parse error:
 * `'unclosedPhrase'` when a quoted phrase is still open, `'trailingEscape'` when the term ends on a lone
 * backslash, `'danglingOperator'` when it ends (or starts) on a Boolean operator, `null` when it is
 * complete. Search-as-you-type sends such a term whenever the user pauses before the closing quote
 * (DEV-7370) or before the term after an `AND` (DEV-7441).
 *
 * Follows Lucene's escaping rule: a backslash escapes the next character, whatever it is. So `\"` is a
 * literal quote and opens no phrase, while `\\"` is a literal backslash followed by a real quote. Check
 * the term as typed: the SPARQL escaping of the query literal is undone by dsp-api before Lucene sees it.
 */
export function incompleteLuceneSyntax(term: string): 'unclosedPhrase' | 'trailingEscape' | 'danglingOperator' | null {
  let inPhrase = false;
  for (let i = 0; i < term.length; i++) {
    if (term[i] === '\\') {
      if (i === term.length - 1) {
        return 'trailingEscape';
      }
      i++;
    } else if (term[i] === '"') {
      inPhrase = !inPhrase;
    }
  }
  if (inPhrase) {
    return 'unclosedPhrase';
  }
  // The phrases are closed, so a whitespace-separated token at either end is a whole operator only when
  // it stands outside one: an edge of a phrase always carries its quote (`"foo AND"` ends on `AND"`),
  // and an escaped operator its backslash.
  const tokens = term.split(/\s+/);
  return OPERATORS_NEEDING_A_TERM_AFTER.has(tokens[tokens.length - 1]) || OPERATORS_NEEDING_A_TERM_BEFORE.has(tokens[0])
    ? 'danglingOperator'
    : null;
}

/**
 * Rejects a term Lucene cannot parse yet (see {@link incompleteLuceneSyntax}). Applied by the advanced
 * search bar, which searches as the user types. Not part of {@link fulltextSearchTermValidator}: the
 * simple search runs only on submit, so it was left out of DEV-7370 and is unverified against
 * `/v2/search/:term`, not known to be unneeded there.
 */
export function searchTermCompleteSyntaxValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const incomplete = incompleteLuceneSyntax((control.value ?? '').trim());
    switch (incomplete) {
      case 'unclosedPhrase':
        return { searchTermUnclosedPhrase: true };
      case 'trailingEscape':
        return { searchTermTrailingEscape: true };
      case 'danglingOperator':
        return { searchTermDanglingOperator: true };
      default:
        return null;
    }
  };
}

/**
 * Splits a term the way dsp-api's `LuceneQueryString.termsAndPhrases` does, keeping a quoted phrase
 * (`"down the rabbit hole"`) whole instead of chopping it on its spaces. Same expression as
 * `ApacheLuceneSupport.separateTermsAndPhrasesRegex`, and it has to stay the same: splitting a phrase
 * on whitespace makes its last word a token of its own, so `"a b*"` looks like a wildcard on a
 * one-character stem and gets refused — while the endpoint answers it with a 200, since inside quotes
 * the `*` is a literal.
 */
const TERMS_AND_PHRASES = /[^\s]*".*?"[^\s]*|[^\s]+/g;

/**
 * The rule of the fulltext endpoint (`/v2/search/:term`): the min-length rule above, plus — unlike it —
 * a *per-term* one. Every term holding a wildcard needs at least {@link MIN_SEARCH_TERM_LENGTH}
 * characters besides its wildcards, so `de*` and `hello de*` are both rejected while `ide*`, `de*x`
 * and `buch de` pass.
 *
 * Measured against the dev API. Do NOT use this on the advanced search bar: its term travels through
 * Gravsearch `matchFulltext`, which accepts `de*` (200) and only enforces the min-length half.
 */
export function fulltextSearchTermValidator(): ValidatorFn {
  const minLength = searchTermMinLengthValidator();

  return (control: AbstractControl): ValidationErrors | null => {
    const tooShort = minLength(control);
    if (tooShort) {
      return tooShort;
    }

    const term = (control.value ?? '').trim();
    const hasShortWildcardTerm = (term.match(TERMS_AND_PHRASES) ?? [])
      .filter((token: string) => WILDCARD.test(token))
      .some((token: string) => token.replace(WILDCARDS_GLOBAL, '').length < MIN_SEARCH_TERM_LENGTH);

    return hasShortWildcardTerm ? { searchWildcardTooShort: { requiredLength: MIN_SEARCH_TERM_LENGTH } } : null;
  };
}
