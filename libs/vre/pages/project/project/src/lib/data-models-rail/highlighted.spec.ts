import { hasText, highlighted } from './highlighted';

describe('highlighted', () => {
  it('keeps the whole text without a query', () => {
    expect(highlighted('Full Name', '  ')).toEqual([{ text: 'Full Name', match: false }]);
  });

  it('marks every match, whatever its case, keeping the text as written', () => {
    expect(highlighted('GND or gnd', 'Gnd')).toEqual([
      { text: 'GND', match: true },
      { text: ' or ', match: false },
      { text: 'gnd', match: true },
    ]);
  });

  it('marks nothing when the text lacks the query', () => {
    expect(highlighted('Surname', 'gnd')).toEqual([{ text: 'Surname', match: false }]);
  });
});

describe('hasText', () => {
  it('finds the query in any case, and nothing for an empty one', () => {
    expect(hasText('hasGNDId', 'gnd')).toBe(true);
    expect(hasText('hasGNDId', '')).toBe(false);
    expect(hasText(undefined, 'gnd')).toBe(false);
  });
});
