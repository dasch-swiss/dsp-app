import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { StringifyStringLiteralPipe } from './stringify-string-literal.pipe';

describe('StringifyStringLiteralPipe', () => {
  let pipe: StringifyStringLiteralPipe;
  let localization: { currentLanguage: string };

  beforeEach(() => {
    localization = { currentLanguage: 'en' };
    pipe = new StringifyStringLiteralPipe(localization as unknown as LocalizationService);
  });

  it('returns the value matching the current language when present', () => {
    localization.currentLanguage = 'en';
    const labels = [
      { language: 'de', value: 'Dokumentation' },
      { language: 'en', value: 'Documentation' },
    ];
    expect(pipe.transform(labels)).toBe('Documentation');
  });

  it('falls back to the first non-empty value when the current language is missing', () => {
    localization.currentLanguage = 'fr';
    const labels = [
      { language: 'de', value: 'Dokumentation' },
      { language: 'en', value: 'Documentation' },
    ];
    // No hardcoded English preference — first non-empty wins.
    expect(pipe.transform(labels)).toBe('Dokumentation');
  });

  it('falls back to the only available label regardless of language', () => {
    localization.currentLanguage = 'en';
    const labels = [{ language: 'de', value: '7. Ort' }];
    expect(pipe.transform(labels)).toBe('7. Ort');
  });

  it('never consults the browser language (regression for DEV-6319 / DEV-6535)', () => {
    // Even when current lang is missing AND English is missing, browser language
    // must not be used — only the first non-empty value.
    localization.currentLanguage = 'fr';
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
    localization.currentLanguage = 'en';
    const labels = [
      { language: 'en', value: '' },
      { language: 'de', value: '   ' },
      { language: 'fr', value: 'Tombeau' },
    ];
    expect(pipe.transform(labels)).toBe('Tombeau');
  });

  it('reflects the current language on every call (impure pipe)', () => {
    const labels = [
      { language: 'de', value: 'Dokumentation' },
      { language: 'en', value: 'Documentation' },
    ];
    localization.currentLanguage = 'en';
    expect(pipe.transform(labels)).toBe('Documentation');

    localization.currentLanguage = 'de';
    expect(pipe.transform(labels)).toBe('Dokumentation');
  });

  describe('memoization', () => {
    it('returns the same string instance on repeat calls with unchanged inputs', () => {
      const labels = [
        { language: 'de', value: 'Dokumentation' },
        { language: 'en', value: 'Documentation' },
      ];
      const first = pipe.transform(labels);
      const second = pipe.transform(labels);
      // Same string content AND same reference — confirms the cached branch was hit.
      expect(second).toBe(first);
    });

    it('recomputes when the input array reference changes', () => {
      localization.currentLanguage = 'en';
      const first = pipe.transform([
        { language: 'de', value: 'Dokumentation' },
        { language: 'en', value: 'Documentation' },
      ]);
      const second = pipe.transform([
        { language: 'de', value: 'Hallo' },
        { language: 'en', value: 'Hello' },
      ]);
      expect(first).toBe('Documentation');
      expect(second).toBe('Hello');
    });

    it('recomputes when the current language changes for the same input reference', () => {
      const labels = [
        { language: 'de', value: 'Dokumentation' },
        { language: 'en', value: 'Documentation' },
      ];
      localization.currentLanguage = 'en';
      expect(pipe.transform(labels)).toBe('Documentation');
      localization.currentLanguage = 'de';
      expect(pipe.transform(labels)).toBe('Dokumentation');
    });
  });
});
