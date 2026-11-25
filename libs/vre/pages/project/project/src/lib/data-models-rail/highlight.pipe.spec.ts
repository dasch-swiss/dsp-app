import { hasText, highlightParts } from './highlight.pipe';

describe('highlightParts', () => {
  it('keeps the text whole without terms', () => {
    expect(highlightParts('Author', ['', ' '])).toEqual([{ text: 'Author', match: false }]);
  });

  it('marks every match, case aside', () => {
    expect(highlightParts('Person of a person', ['PERSON'])).toEqual([
      { text: 'Person', match: true },
      { text: ' of a ', match: false },
      { text: 'person', match: true },
    ]);
  });

  it('joins the matches of several terms that overlap', () => {
    expect(highlightParts('hasAuthor', ['has', 'sau'])).toEqual([
      { text: 'hasAu', match: true },
      { text: 'thor', match: false },
    ]);
  });
});

describe('hasText', () => {
  it('finds the query in any case, and nothing for an empty one', () => {
    expect(hasText('hasGNDId', 'gnd')).toBe(true);
    expect(hasText('hasGNDId', '')).toBe(false);
    expect(hasText(undefined, 'gnd')).toBe(false);
  });
});
