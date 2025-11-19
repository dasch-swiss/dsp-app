import { StringLiteralV2 } from '../generated';

/**
 * StringLiteral with required language property.
 * Defined separately since API spec has optional language.
 */
export interface StringLiteralWithLanguage {
  value: string;
  language: string;
}

/**
 * Converts StringLiteralV2[] or unknown[] to StringLiteralWithLanguage[] without data loss.
 * Items without language tags are assigned the default language.
 * This prevents silent data loss when API returns PlainStringLiteralV2.
 * Also useful for DSP-JS StringLiteral types and other external data.
 *
 * @param literals - Array of StringLiteralV2 (union of tagged and plain) or unknown items (e.g., DSP-JS StringLiteral[])
 * @param defaultLanguage - Language to assign to items without language tag (user's current language recommended)
 * @returns Array with all items having language tags
 */
export function ensureWithDefaultLanguage(
  literals: StringLiteralV2[],
  defaultLanguage?: string
): StringLiteralWithLanguage[];
export function ensureWithDefaultLanguage(literals: unknown[], defaultLanguage?: string): StringLiteralWithLanguage[];
export function ensureWithDefaultLanguage(
  literals: StringLiteralV2[] | unknown[],
  defaultLanguage = 'en'
): StringLiteralWithLanguage[] {
  return (literals as Array<{ value?: unknown; language?: unknown }>)
    .filter((item): item is { value: string; language?: unknown } => typeof item?.value === 'string')
    .map(item => ({
      value: item.value,
      language: typeof item.language === 'string' && item.language.length > 0 ? item.language : defaultLanguage,
    }));
}
