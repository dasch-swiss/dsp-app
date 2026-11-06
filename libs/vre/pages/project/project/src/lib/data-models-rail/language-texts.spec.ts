import { missingLanguages, shownTexts } from './language-texts.component';

const texts = [
  { language: 'fr', value: 'Lettre' },
  { language: 'en', value: 'Letter' },
  { language: 'de', value: 'Brief' },
];

describe('shownTexts', () => {
  it('lists every language in the order the app lists them', () => {
    expect(shownTexts(texts, 'Brief', true).map(text => text.language)).toEqual(['en', 'de', 'fr']);
  });

  it('shows only the text the app shows with "All languages" off', () => {
    expect(shownTexts(texts, 'Brief', false)).toEqual([{ language: 'de', value: 'Brief' }]);
  });

  it('falls back to the first language when the shown text has none', () => {
    expect(shownTexts(texts, 'Something else', false)).toEqual([{ language: 'en', value: 'Letter' }]);
    expect(shownTexts([], '', false)).toEqual([]);
  });
});

describe('missingLanguages', () => {
  it('offers every language without a text', () => {
    expect(missingLanguages(texts, true, 'en')).toEqual(['it', 'rm']);
  });

  it('offers nothing with "All languages" off when there is a text', () => {
    expect(missingLanguages(texts, false, 'en')).toEqual([]);
  });

  it('offers the interface language for a missing text, else English', () => {
    expect(missingLanguages([], false, 'de')).toEqual(['de']);
    expect(missingLanguages([], false, 'xx')).toEqual(['en']);
  });
});
