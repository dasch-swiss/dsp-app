import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { StringifyStringLiteralPipe } from './stringify-string-literal.pipe';

describe('StringifyStringLiteralPipe', () => {
  let pipe: StringifyStringLiteralPipe;
  let localizationService: { currentLanguage: string };

  beforeEach(() => {
    localizationService = { currentLanguage: 'en' };
    pipe = new StringifyStringLiteralPipe(localizationService as unknown as LocalizationService);
  });

  it('returns the value matching the current language when present', () => {
    localizationService.currentLanguage = 'en';
    const labels = [
      { language: 'de', value: 'Dokumentation' },
      { language: 'en', value: 'Documentation' },
    ];
    expect(pipe.transform(labels)).toBe('Documentation');
  });

  it('falls back to the first non-empty value when the current language is missing', () => {
    localizationService.currentLanguage = 'fr';
    const labels = [
      { language: 'de', value: 'Dokumentation' },
      { language: 'en', value: 'Documentation' },
    ];
    // No hardcoded English preference — first non-empty wins.
    expect(pipe.transform(labels)).toBe('Dokumentation');
  });

  it('falls back to the only available label regardless of language', () => {
    localizationService.currentLanguage = 'en';
    const labels = [{ language: 'de', value: '7. Ort' }];
    expect(pipe.transform(labels)).toBe('7. Ort');
  });

  it('never consults the browser language (regression for DEV-6319 / DEV-6535)', () => {
    // Even when current lang is missing AND English is missing, browser language
    // must not be used — only the first non-empty value.
    localizationService.currentLanguage = 'fr';
    const labels = [
      { language: 'it', value: 'Tomba' },
      { language: 'rm', value: 'Tomba' },
    ];
    expect(pipe.transform(labels)).toBe('Tomba');
  });

  it('returns empty string for null/undefined/empty input', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform([])).toBe('');
  });

  it('skips empty string values when falling back', () => {
    localizationService.currentLanguage = 'en';
    const labels = [
      { language: 'en', value: '' },
      { language: 'de', value: '   ' },
      { language: 'fr', value: 'Tombeau' },
    ];
    expect(pipe.transform(labels)).toBe('Tombeau');
  });
});
