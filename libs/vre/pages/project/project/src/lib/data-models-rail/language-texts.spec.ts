import { missingLanguages, shownTexts } from './language-texts.component';

const texts = [
  { language: 'fr', value: 'Lettre' },
  { language: 'en', value: 'Letter' },
  { language: 'de', value: 'Brief' },
];

describe('shownTexts', () => {
  it('lists the chosen languages in the order the app lists them', () => {
    expect(shownTexts(texts, 'Brief', ['fr', 'en', 'it']).map(text => text.language)).toEqual(['en', 'fr']);
  });

  it('shows only the text the app shows with no language chosen', () => {
    expect(shownTexts(texts, 'Brief', null)).toEqual([{ language: 'de', value: 'Brief' }]);
  });

  it('falls back to the first language when the shown text has none', () => {
    expect(shownTexts(texts, 'Something else', null)).toEqual([{ language: 'en', value: 'Letter' }]);
    expect(shownTexts([], '', null)).toEqual([]);
  });
});

describe('missingLanguages', () => {
  it('offers the chosen languages without a text', () => {
    expect(missingLanguages(texts, ['en', 'it', 'rm'], 'en')).toEqual(['it', 'rm']);
  });

  it('offers nothing with no language chosen when there is a text', () => {
    expect(missingLanguages(texts, null, 'en')).toEqual([]);
  });

  it('offers the interface language for a missing text, else English', () => {
    expect(missingLanguages([], null, 'de')).toEqual(['de']);
    expect(missingLanguages([], null, 'xx')).toEqual(['en']);
  });
});
