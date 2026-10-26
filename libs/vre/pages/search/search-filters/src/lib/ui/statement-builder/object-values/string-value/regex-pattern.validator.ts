import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Whether the "is like" value is a pattern dsp-api can compile. dsp-api validates it with
 * `java.util.regex` (dsp-api#4368) and the value reaches it as typed, so a glob-style `*MAL*` is
 * rejected with "Dangling meta character '*'" — but only after the filter is confirmed and searched
 * (DEV-7441).
 *
 * JavaScript's `RegExp` alone is the wrong judge in both directions: it rejects Java syntax dsp-api
 * runs (`(?i)`, `a*+`, `\Q…\E`, `\h`) and accepts patterns Java refuses (`{MAL}`, `a{`, `\y`). So the
 * pattern is first walked with Java's rules ({@link toJavaScriptPattern}): escapes, quantifiers, braces
 * and group openers are checked there, and Java-only constructs are swapped for JavaScript equivalents.
 * An unmatched `)` is caught in the walk; `RegExp` then checks what both engines share — unclosed groups
 * and character-class ranges.
 *
 * The check errs towards accepting: a pattern it lets through that Java refuses (e.g. an unknown
 * `\p{…}` name) still gets dsp-api's 400 in the failure panel, but a pattern it refused could not be
 * searched at all.
 */
export function isCompilableRegex(pattern: string): boolean {
  let translated: string | typeof INVALID | typeof UNCHECKED;
  try {
    translated = toJavaScriptPattern(pattern);
  } catch {
    // A pathologically nested pattern overflows the scanner's stack; accepting is the safe side.
    return true;
  }
  if (translated === UNCHECKED) {
    return true;
  }
  if (translated === INVALID) {
    return false;
  }
  try {
    new RegExp(translated);
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
    // The component emits the trimmed value, so that is what dsp-api receives and what is judged.
    return isCompilableRegex(value.trim()) ? null : { invalidRegex: true };
  };
}

const INVALID = Symbol('invalid');
/** Comments mode (`(?x)`) changes how the rest is read; such a pattern is left to dsp-api. */
const UNCHECKED = Symbol('unchecked');

/** `substituted`: `js` is a stand-in for a character JavaScript cannot express, not that character. */
type Scanned = { js: string; end: number; substituted?: true };

/** What a quantifier at the current position would apply to. */
type Previous = 'nothing' | 'atom' | 'quantifier' | 'modifiedQuantifier';

/**
 * Walks `pattern` with `java.util.regex`'s rules and returns a JavaScript pattern that compiles exactly
 * when the remaining structure (unclosed groups, character-class ranges) is valid. Quantifiers are checked here
 * and left out of the result, since the engines disagree on where they may stand (Java takes `^*` and
 * `a{2}{3}`).
 */
function toJavaScriptPattern(pattern: string): string | typeof INVALID | typeof UNCHECKED {
  const groupNames = new Set<string>();
  let js = '';
  let previous: Previous = 'nothing';
  let depth = 0;
  let i = 0;

  while (i < pattern.length) {
    const c = pattern[i];

    if (c === '\\') {
      const escape = scanEscape(pattern, i, false, groupNames);
      if (escape === INVALID) return INVALID;
      js += escape.js;
      i = escape.end;
      previous = 'atom';
    } else if (c === '[') {
      const characterClass = scanClass(pattern, i, groupNames);
      if (characterClass === INVALID) return INVALID;
      js += characterClass.js;
      i = characterClass.end;
      previous = 'atom';
    } else if (c === '(') {
      const group = scanGroupOpening(pattern, i, groupNames);
      if (group === INVALID || group === UNCHECKED) return group;
      if (group.opensGroup) depth++;
      js += group.js;
      i = group.end;
      previous = 'nothing';
    } else if (c === '*' || c === '+' || c === '?') {
      if (previous === 'nothing' || previous === 'modifiedQuantifier') return INVALID;
      if (previous === 'quantifier') {
        // `a*?` is lazy and `a*+` possessive; any further quantifier is dangling.
        if (c === '*') return INVALID;
        previous = 'modifiedQuantifier';
      } else {
        previous = 'quantifier';
      }
      i++;
    } else if (c === '{') {
      const bounds = /^\{(\d+)(?:,(\d*))?\}/.exec(pattern.slice(i));
      if (!bounds || !areValidBounds(bounds[1], bounds[2])) return INVALID;
      i += bounds[0].length;
      previous = 'quantifier';
    } else if (c === ')' && depth-- === 0) {
      // Checked here so that a later `(?x)`, which ends the walk, cannot hide it.
      return INVALID;
    } else {
      // A matched `)`, `|`, anchors and literals. A literal `]` or `}` is fine in Java; escape it for JavaScript.
      js += c === ']' || c === '}' ? `\\${c}` : c;
      previous = c === '|' ? 'nothing' : 'atom';
      i++;
    }
  }
  return js;
}

function areValidBounds(min: string, max: string | undefined): boolean {
  const limit = 2 ** 31 - 1;
  const lower = Number(min);
  const upper = max === undefined || max === '' ? lower : Number(max);
  return lower <= limit && upper <= limit && lower <= upper;
}

/** Escapes Java accepts by letter; the rest of the alphabet is "Illegal/unsupported escape sequence". */
const SHARED_ESCAPES = new Set('dDsSwWnrtfv');
const JAVA_ONLY_CHARACTER_ESCAPES = new Set('hHRXVea');
const JAVA_ANCHOR_ESCAPES = new Set('bBAGZz');

function scanEscape(pattern: string, i: number, inClass: boolean, groupNames: Set<string>): Scanned | typeof INVALID {
  const next = pattern[i + 1];
  const rest = pattern.slice(i + 2);
  // A neutral single character, standing in for an escape JavaScript does not know.
  const substitute = (end: number): Scanned => ({ js: 'a', end, substituted: true });

  if (next === undefined || next === 'E') return INVALID;
  if (next === 'Q') {
    const close = pattern.indexOf('\\E', i + 2);
    const quoted = close < 0 ? pattern.slice(i + 2) : pattern.slice(i + 2, close);
    const literal = quoted.replace(/[\\^$.*+?()[\]{}|/-]/g, '\\$&');
    return { js: inClass ? literal : `(?:${literal})`, end: close < 0 ? pattern.length : close + 2 };
  }
  if (SHARED_ESCAPES.has(next)) return { js: `\\${next}`, end: i + 2 };
  // Anchors, back references and the multi-character `\R` and `\X` match no single character, so Java
  // refuses them inside a character class.
  if (inClass && (JAVA_ANCHOR_ESCAPES.has(next) || /[1-9kRX]/.test(next))) return INVALID;
  if (JAVA_ONLY_CHARACTER_ESCAPES.has(next)) return substitute(i + 2);
  if (JAVA_ANCHOR_ESCAPES.has(next)) {
    return { js: '(?:)', end: next === 'b' && rest.startsWith('{g}') ? i + 5 : i + 2 };
  }
  if (next === 'c') return rest === '' ? INVALID : substitute(i + 3);
  if (next === 'x') {
    const hex = /^(?:[0-9a-fA-F]{2}|\{([0-9a-fA-F]+)\})/.exec(rest);
    if (!hex || (hex[1] !== undefined && parseInt(hex[1], 16) > 0x10ffff)) return INVALID;
    return substitute(i + 2 + hex[0].length);
  }
  if (next === 'u') return /^[0-9a-fA-F]{4}/.test(rest) ? substitute(i + 6) : INVALID;
  if (next === 'p' || next === 'P') {
    // A one-letter `\pL` must be a general category; a braced name is not checked and left to dsp-api.
    const property = /^(?:\{[^}]*\}|[LMNPSZC])/.exec(rest);
    return property ? substitute(i + 2 + property[0].length) : INVALID;
  }
  if (next === 'N') {
    const name = /^\{[^}]*\}/.exec(rest);
    return name ? substitute(i + 2 + name[0].length) : INVALID;
  }
  if (next === 'k') {
    const name = /^<([a-zA-Z][a-zA-Z0-9]*)>/.exec(rest);
    return name && groupNames.has(name[1]) ? { js: '(?:)', end: i + 2 + name[0].length } : INVALID;
  }
  if (next === '0') {
    const octal = /^(?:[0-3][0-7]{2}|[0-7]{1,2})/.exec(rest);
    return octal ? substitute(i + 2 + octal[0].length) : INVALID;
  }
  if (/[1-9]/.test(next)) {
    // A back reference; Java accepts one to a group that does not exist.
    return { js: '(?:)', end: i + 2 };
  }
  if (/[a-zA-Z]/.test(next)) return INVALID;
  // Any other character escaped stands for itself.
  return { js: `\\${next}`, end: i + 2 };
}

/**
 * A Java character class, which may nest (`[a[bc]]`) and intersect (`[a-z&&[^aeiou]]`). A plain class is
 * handed to JavaScript as is, so it can check the ranges; one using Java-only syntax or a substituted
 * escape becomes `[a]`, leaving its ranges unchecked.
 */
function scanClass(pattern: string, i: number, groupNames: Set<string>): Scanned | typeof INVALID {
  let j = i + 1;
  const negation = pattern[j] === '^' ? '^' : '';
  j += negation.length;
  let body = '';
  let plain = true;
  if (pattern[j] === ']') {
    // A `]` right after the opening bracket is a literal.
    body += '\\]';
    j++;
  }
  for (;;) {
    if (j >= pattern.length) return INVALID;
    const c = pattern[j];
    if (c === ']') {
      return { js: plain ? `[${negation}${body}]` : '[a]', end: j + 1 };
    }
    if (c === '[') {
      const nested = scanClass(pattern, j, groupNames);
      if (nested === INVALID) return INVALID;
      plain = false;
      j = nested.end;
    } else if (c === '&' && pattern[j + 1] === '&') {
      plain = false;
      j += 2;
    } else if (c === '\\') {
      const escape = scanEscape(pattern, j, true, groupNames);
      if (escape === INVALID) return INVALID;
      if (escape.substituted) plain = false;
      body += escape.js;
      j = escape.end;
    } else {
      body += c;
      j++;
    }
  }
}

function scanGroupOpening(
  pattern: string,
  i: number,
  groupNames: Set<string>
): (Scanned & { opensGroup: boolean }) | typeof INVALID | typeof UNCHECKED {
  if (pattern[i + 1] !== '?') return { js: '(', end: i + 1, opensGroup: true };
  const rest = pattern.slice(i + 2);

  // Non-capturing, lookahead and atomic groups; lookbehind. All open a group JavaScript understands.
  const special = /^(?:[:=!>]|<[=!])/.exec(rest);
  if (special) return { js: '(?:', end: i + 2 + special[0].length, opensGroup: true };

  const named = /^<([a-zA-Z][a-zA-Z0-9]*)>/.exec(rest);
  if (named) {
    if (groupNames.has(named[1])) return INVALID;
    groupNames.add(named[1]);
    return { js: '(', end: i + 2 + named[0].length, opensGroup: true };
  }

  // Inline flags, `(?i)` or `(?i-s:…)`. Comments mode makes whitespace and `#…` insignificant.
  const flags = /^([idmsuxUc]*)(?:-([idmsuxUc]*))?([:)])/.exec(rest);
  if (flags) {
    if (flags[1].includes('x')) return UNCHECKED;
    // `(?i)` sets flags and closes itself; `(?i:` opens a group.
    const opensGroup = flags[3] === ':';
    return { js: opensGroup ? '(?:' : '', end: i + 2 + flags[0].length, opensGroup };
  }
  return INVALID;
}
