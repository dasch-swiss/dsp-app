import { ReadFileValue } from '@dasch-swiss/dsp-js';
import { isPlaceholderFileValue, PLACEHOLDER_FILE_SENTINEL } from './is-placeholder-file-value';

describe('isPlaceholderFileValue', () => {
  const fileValueWith = (filename: string): ReadFileValue => ({ filename }) as ReadFileValue;

  it('returns true when the filename is the placeholder sentinel', () => {
    expect(isPlaceholderFileValue(fileValueWith(PLACEHOLDER_FILE_SENTINEL))).toBe(true);
  });

  it('returns false for a regular filename', () => {
    expect(isPlaceholderFileValue(fileValueWith('abc123.jp2'))).toBe(false);
  });

  it('returns false when the filename merely contains the sentinel as a substring', () => {
    expect(isPlaceholderFileValue(fileValueWith(`${PLACEHOLDER_FILE_SENTINEL}.jp2`))).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(isPlaceholderFileValue(null)).toBe(false);
    expect(isPlaceholderFileValue(undefined)).toBe(false);
  });
});
