import { StringLiteralV2 } from '../generated';
import { StringLiteralWithLanguage, ensureWithDefaultLanguage } from './type-guards';

describe('Type Guards', () => {
  describe('StringLiteralWithLanguage', () => {
    it('should define interface with value and language', () => {
      const literal: StringLiteralWithLanguage = {
        value: 'test',
        language: 'en',
      };

      expect(literal.value).toBe('test');
      expect(literal.language).toBe('en');
    });
  });

  describe('ensureWithDefaultLanguage', () => {
    it('should preserve items with language tags', () => {
      const items: StringLiteralV2[] = [
        { value: 'Hello', language: 'en' },
        { value: 'Bonjour', language: 'fr' },
      ];

      const result = ensureWithDefaultLanguage(items);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ value: 'Hello', language: 'en' });
      expect(result[1]).toEqual({ value: 'Bonjour', language: 'fr' });
    });

    it('should assign default language to plain items', () => {
      const items: StringLiteralV2[] = [
        { value: 'Hello', language: 'en' },
        { value: 'Plain text' }, // PlainStringLiteralV2
      ];

      const result = ensureWithDefaultLanguage(items);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ value: 'Hello', language: 'en' });
      expect(result[1]).toEqual({ value: 'Plain text', language: 'en' });
    });

    it('should use custom default language', () => {
      const items: StringLiteralV2[] = [{ value: 'Plain text' }, { value: 'Another plain' }];

      const result = ensureWithDefaultLanguage(items, 'de');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ value: 'Plain text', language: 'de' });
      expect(result[1]).toEqual({ value: 'Another plain', language: 'de' });
    });

    it('should filter out items with empty language string', () => {
      const items: StringLiteralV2[] = [
        { value: 'Hello', language: 'en' },
        { value: 'Empty lang', language: '' },
      ];

      const result = ensureWithDefaultLanguage(items);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ value: 'Hello', language: 'en' });
      expect(result[1]).toEqual({ value: 'Empty lang', language: 'en' });
    });

    it('should handle empty array', () => {
      const result = ensureWithDefaultLanguage([]);

      expect(result).toHaveLength(0);
    });

    it('should prevent data loss for mixed items', () => {
      const items: StringLiteralV2[] = [
        { value: 'Tagged 1', language: 'en' },
        { value: 'Plain 1' },
        { value: 'Tagged 2', language: 'fr' },
        { value: 'Plain 2' },
      ];

      const result = ensureWithDefaultLanguage(items, 'de');

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ value: 'Tagged 1', language: 'en' });
      expect(result[1]).toEqual({ value: 'Plain 1', language: 'de' });
      expect(result[2]).toEqual({ value: 'Tagged 2', language: 'fr' });
      expect(result[3]).toEqual({ value: 'Plain 2', language: 'de' });
    });

    it('should work with unknown[] (DSP-JS StringLiteral types)', () => {
      const items: unknown[] = [{ value: 'DSP-JS tagged', language: 'en' }, { value: 'DSP-JS plain' }];

      const result = ensureWithDefaultLanguage(items, 'fr');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ value: 'DSP-JS tagged', language: 'en' });
      expect(result[1]).toEqual({ value: 'DSP-JS plain', language: 'fr' });
    });

    it('should filter out items without value property', () => {
      const items: unknown[] = [
        { value: 'Valid', language: 'en' },
        { language: 'en' }, // No value
        { value: 123 }, // Non-string value
        { value: 'Another valid' },
      ];

      const result = ensureWithDefaultLanguage(items);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ value: 'Valid', language: 'en' });
      expect(result[1]).toEqual({ value: 'Another valid', language: 'en' });
    });

    it('should handle null and undefined items', () => {
      const items = [{ value: 'Valid', language: 'en' }, null, undefined, { value: 'Another valid' }] as unknown[];

      const result = ensureWithDefaultLanguage(items);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ value: 'Valid', language: 'en' });
      expect(result[1]).toEqual({ value: 'Another valid', language: 'en' });
    });

    it('should handle items with non-string language property', () => {
      const items: unknown[] = [
        { value: 'Valid', language: 'en' },
        { value: 'Invalid lang', language: 123 },
        { value: 'Another valid', language: 'de' },
      ];

      const result = ensureWithDefaultLanguage(items, 'fr');

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ value: 'Valid', language: 'en' });
      expect(result[1]).toEqual({ value: 'Invalid lang', language: 'fr' });
      expect(result[2]).toEqual({ value: 'Another valid', language: 'de' });
    });
  });

  describe('Type compatibility', () => {
    it('should be compatible with LanguageTaggedStringLiteralV2', () => {
      const literal: StringLiteralWithLanguage = {
        value: 'test',
        language: 'en',
      };

      // This should compile without errors
      const value: string = literal.value;
      const language: string = literal.language;

      expect(value).toBe('test');
      expect(language).toBe('en');
    });

    it('should work with StringLiteralV2 union type', () => {
      const items: StringLiteralV2[] = [
        { value: 'Tagged', language: 'en' }, // LanguageTaggedStringLiteralV2
        { value: 'Plain' }, // PlainStringLiteralV2
      ];

      const result = ensureWithDefaultLanguage(items, 'de');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ value: 'Tagged', language: 'en' });
      expect(result[1]).toEqual({ value: 'Plain', language: 'de' });
    });
  });
});
