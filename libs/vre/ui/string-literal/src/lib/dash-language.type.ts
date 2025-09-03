import { AvailableLanguages } from '@dasch-swiss/vre/core/config';

export function isDaschLanguage(value: string): boolean {
  return AvailableLanguages.some(lang => lang.language === value);
}
