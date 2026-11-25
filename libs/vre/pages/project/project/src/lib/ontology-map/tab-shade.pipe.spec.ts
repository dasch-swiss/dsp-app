import { tabShade } from './tab-shade.pipe';

describe('tabShade', () => {
  it('darkens and fills a pale class colour, keeping its hue', () => {
    expect(tabShade('#DCEAF7')).toBe('hsl(209 78% 72%)');
  });

  it('keeps white, greys and colours that are not plain hex ones as they are', () => {
    expect(tabShade('#FFFFFF')).toBe('#FFFFFF');
    expect(tabShade('#F3F4F6')).toBe('#F3F4F6');
    expect(tabShade('white')).toBe('white');
    expect(tabShade('repeating-linear-gradient(45deg, red 0 2px), #A9CBEA')).toBe(
      'repeating-linear-gradient(45deg, red 0 2px), #A9CBEA'
    );
  });
});
