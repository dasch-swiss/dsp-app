import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TranslationObject } from '@ngx-translate/core';

/**
 * Loads a translation file straight from disk.
 *
 * The specs in this library assert against the real translations, but importing
 * `apps/dsp-app/src/assets/i18n/*.json` would create a lib -> app -> lib cycle
 * that `@nx/enforce-module-boundaries` rejects. Reading the file at runtime keeps
 * the assertions honest without adding an import-graph edge.
 */
export function loadTranslations(lang: 'en' | 'de'): TranslationObject {
  const path = join(__dirname, '../../../../../../apps/dsp-app/src/assets/i18n', `${lang}.json`);
  return JSON.parse(readFileSync(path, 'utf8')) as TranslationObject;
}
