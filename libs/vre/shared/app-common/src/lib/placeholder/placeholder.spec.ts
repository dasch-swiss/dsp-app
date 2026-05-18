import {
  isPlaceholderAsset,
  isPlaceholderAuthorship,
  isPlaceholderValue,
  PLACEHOLDER_IRI,
} from './placeholder';

describe('placeholder utilities', () => {
  describe('PLACEHOLDER_IRI', () => {
    it('matches the dsp-api sentinel exactly', () => {
      expect(PLACEHOLDER_IRI).toBe('urn:placeholder');
    });
  });

  describe('isPlaceholderValue', () => {
    it('returns true for the sentinel', () => {
      expect(isPlaceholderValue('urn:placeholder')).toBe(true);
    });

    it('returns false for a real value', () => {
      expect(isPlaceholderValue('http://rdfh.ch/licenses/cc-by-4.0')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isPlaceholderValue(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isPlaceholderValue(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isPlaceholderValue('')).toBe(false);
    });
  });

  describe('isPlaceholderAsset', () => {
    it('returns true when filename is the sentinel', () => {
      expect(isPlaceholderAsset({ filename: 'urn:placeholder' })).toBe(true);
    });

    it('returns false for a real filename', () => {
      expect(isPlaceholderAsset({ filename: 'abc123.jp2' })).toBe(false);
    });

    it('returns false when filename is missing', () => {
      expect(isPlaceholderAsset({})).toBe(false);
    });

    it('returns false for null', () => {
      expect(isPlaceholderAsset(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isPlaceholderAsset(undefined)).toBe(false);
    });
  });

  describe('isPlaceholderAuthorship', () => {
    it('returns true for the canonical single-element placeholder form', () => {
      expect(isPlaceholderAuthorship(['urn:placeholder'])).toBe(true);
    });

    it('returns true for a mixed list containing the sentinel (legacy data shape)', () => {
      expect(isPlaceholderAuthorship(['Real Author', 'urn:placeholder'])).toBe(true);
    });

    it('returns false for a list of real authors', () => {
      expect(isPlaceholderAuthorship(['Real Author', 'Another Author'])).toBe(false);
    });

    it('returns false for an empty list', () => {
      expect(isPlaceholderAuthorship([])).toBe(false);
    });

    it('returns false for null', () => {
      expect(isPlaceholderAuthorship(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isPlaceholderAuthorship(undefined)).toBe(false);
    });
  });
});
