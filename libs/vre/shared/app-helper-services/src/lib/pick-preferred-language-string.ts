import { StringLiteral } from '@dasch-swiss/dsp-js';
import { LanguageStringDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AvailableLanguage } from '@dasch-swiss/vre/core/config';

/**
 * Pick the displayable label for the preferred language with fallback.
 * Returns the label in `language` if non-empty; otherwise the first
 * non-empty label in any language; otherwise an empty string.
 *
 * Shared between `StringifyStringLiteralPipe` (display) and any
 * call site that needs the same string for sort-key consistency.
 */
export function pickPreferredLanguageString(
  value: ReadonlyArray<StringLiteral | LanguageStringDto> | null | undefined,
  language: AvailableLanguage
): string {
  if (!value || value.length === 0) return '';
  const byLanguage = value.find(l => l.language === language)?.value;
  if (byLanguage && byLanguage.trim() !== '') return byLanguage;
  const firstNonEmpty = value.find(l => l.value && l.value.trim() !== '')?.value;
  return firstNonEmpty ?? '';
}
