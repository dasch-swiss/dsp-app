export type DaschLanguage = 'de' | 'fr' | 'it' | 'en' | 'rm';

export function isDaschLanguage(value: string): value is DaschLanguage {
  return ['de', 'fr', 'it', 'en', 'rm'].includes(value);
}
