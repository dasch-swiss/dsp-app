import { pickPreferredLanguageString } from './pick-preferred-language-string';

describe('pickPreferredLabel', () => {
  it('returns the preferred-language value when present and non-empty', () => {
    const labels = [
      { language: 'de', value: 'Dokumentation' },
      { language: 'en', value: 'Documentation' },
    ];
    expect(pickPreferredLanguageString(labels, 'en')).toBe('Documentation');
  });

  it('returns the first non-empty value when preferred language is missing', () => {
    const labels = [
      { language: 'de', value: 'Dokumentation' },
      { language: 'en', value: 'Documentation' },
    ];
    expect(pickPreferredLanguageString(labels, 'fr')).toBe('Dokumentation');
  });

  it('returns the first non-empty value when preferred value is empty', () => {
    const labels = [
      { language: 'en', value: '' },
      { language: 'de', value: 'Dokumentation' },
    ];
    expect(pickPreferredLanguageString(labels, 'en')).toBe('Dokumentation');
  });

  it('returns the first non-empty value when preferred value is whitespace-only', () => {
    const labels = [
      { language: 'en', value: '   ' },
      { language: 'de', value: 'Dokumentation' },
    ];
    expect(pickPreferredLanguageString(labels, 'en')).toBe('Dokumentation');
  });

  it('returns empty string for null, undefined, or empty input', () => {
    expect(pickPreferredLanguageString(null, 'en')).toBe('');
    expect(pickPreferredLanguageString(undefined, 'en')).toBe('');
    expect(pickPreferredLanguageString([], 'en')).toBe('');
  });
});
