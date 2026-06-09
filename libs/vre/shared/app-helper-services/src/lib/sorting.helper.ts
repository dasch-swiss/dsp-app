import { StringLiteral } from '@dasch-swiss/dsp-js';
import { LanguageStringDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AvailableLanguage } from '@dasch-swiss/vre/core/config';
import { pickPreferredLabel } from './pick-preferred-label';

export class SortingHelper {
  /**
   * Sort items alphabetically by a property key, case-insensitively.
   * Use for admin tables where the sort field is a non-translatable string
   * (username, email, shortname). For multi-language labels use `sortByLocalizedString`.
   */
  static keySortByAlphabetical<T extends object>(items: ReadonlyArray<T>, key: keyof T): T[] {
    return [...items].sort((a, b) =>
      String(a[key] ?? '').localeCompare(String(b[key] ?? ''), undefined, { sensitivity: 'base' })
    );
  }

  /**
   * Language-aware string comparator with consistent collation options across the app.
   * `language` is one of the UI languages exposed by `LocalizationService`.
   * Falls back to empty string for nullish input.
   */
  static compareStringsByLanguage(
    a: string | undefined | null,
    b: string | undefined | null,
    language: AvailableLanguage
  ): number {
    return (a ?? '').localeCompare(b ?? '', language, {
      numeric: true,
      sensitivity: 'variant',
      ignorePunctuation: false,
    });
  }

  /**
   * Sort items by a localized string accessor using language-aware collation.
   *
   * Resolves each item's language-tagged values to the current language via
   * `pickPreferredLabel`, then compares with language-aware collation. Use
   * whenever the underlying field is `StringLiteral[]` / `LanguageStringDto[]`.
   */
  static sortByLocalizedString<T>(
    items: ReadonlyArray<T>,
    getValues: (item: T) => ReadonlyArray<StringLiteral | LanguageStringDto> | null | undefined,
    language: AvailableLanguage
  ): T[] {
    return [...items].sort((a, b) =>
      SortingHelper.compareStringsByLanguage(
        pickPreferredLabel(getValues(a), language),
        pickPreferredLabel(getValues(b), language),
        language
      )
    );
  }
}
