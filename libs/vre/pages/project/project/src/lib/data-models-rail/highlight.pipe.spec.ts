import { highlightParts } from './highlight.pipe';

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
