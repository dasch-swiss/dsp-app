import { StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { AvailableLanguageKeys } from '@dasch-swiss/vre/core/config';
import { TranslateService, getValue } from '@ngx-translate/core';

/**
 * Build a multi-language `StringLiteralV2[]` from an i18n translation key.
 *
 * Reads the translation for the same key in every locale registered in
 * `AvailableLanguageKeys`, so synthetic items (e.g. the resource-label
 * pseudo-predicate, the "all resource classes" option) carry the same
 * shape as ontology-derived labels — `OntologyDataService` can then
 * treat them uniformly downstream and `appStringifyStringLiteral` picks
 * the right language at display time.
 *
 * The function reads from `TranslateService.translations[language]`
 * synchronously, which requires the locale JSON to have been loaded at
 * call time. In dsp-app this is guaranteed by the bootstrap loader
 * (TranslateModule.forRoot at app startup) before any feature module
 * is instantiated.
 *
 * Missing translation fallback: when the key is not present in a given
 * language's table the key itself is returned. This matches the
 * default ngx-translate behaviour for `instant()`.
 */
export const labelsFromI18n = (translate: TranslateService, key: string): StringLiteralV2[] =>
  AvailableLanguageKeys.map(language => {
    const raw = getValue(translate.translations[language] ?? {}, key);
    return { language, value: typeof raw === 'string' ? raw : key };
  });
