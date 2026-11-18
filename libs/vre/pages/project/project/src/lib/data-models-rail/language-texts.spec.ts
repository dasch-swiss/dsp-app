import { missingLanguages, shownTexts } from './language-texts.component';

const texts = [
  { language: 'fr', value: 'Lettre' },
  { language: 'en', value: 'Letter' },
  { language: 'de', value: 'Brief' },
];

describe('shownTexts', () => {
  it('shows only the text the app shows', () => {
    expect(shownTexts(texts, 'Brief')).toEqual([{ language: 'de', value: 'Brief' }]);
  });

  it('falls back to the first language when the shown text has none', () => {
    expect(shownTexts(texts, 'Something else')).toEqual([{ language: 'en', value: 'Letter' }]);
    expect(shownTexts([], '')).toEqual([]);
  });
});

describe('missingLanguages', () => {
  it('offers nothing when there is a text', () => {
    expect(missingLanguages(texts, 'en')).toEqual([]);
  });

  it('offers the interface language for a missing text, else English', () => {
    expect(missingLanguages([], 'de')).toEqual(['de']);
    expect(missingLanguages([], 'xx')).toEqual(['en']);
  });
});
