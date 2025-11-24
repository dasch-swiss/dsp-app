import { FormControl } from '@angular/forms';
import { crossProjectLinkValidator } from './cross-project-link.validator';

describe('crossProjectLinkValidator', () => {
  const currentProjectShortcode = '0854';

  describe('Valid cases - should return null (no errors)', () => {
    it('should pass when no links are present in the content', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl('<p>Some plain text without any links</p>');

      const result = validator(control);

      expect(result).toBeNull();
    });

    it('should pass when content is empty', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl('');

      const result = validator(control);

      expect(result).toBeNull();
    });

    it('should pass when content is null', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl(null);

      const result = validator(control);

      expect(result).toBeNull();
    });

    it('should pass when projectShortcode is null or undefined', () => {
      const validatorNull = crossProjectLinkValidator(null);
      const validatorUndefined = crossProjectLinkValidator(undefined);
      const control = new FormControl('<p>Content with <a href="http://rdfh.ch/0854/someUuid">link</a></p>');

      expect(validatorNull(control)).toBeNull();
      expect(validatorUndefined(control)).toBeNull();
    });

    it('should pass when link is to the same project', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl(
        '<p>Link to same project: <a href="http://rdfh.ch/0854/4Knj9rzPTpeVCnZKUCckWw">Resource</a></p>'
      );

      const result = validator(control);

      expect(result).toBeNull();
    });

    it('should pass when multiple links are all to the same project', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl(
        '<p>Multiple links: <a href="http://rdfh.ch/0854/uuid1">Link1</a> and <a href="http://rdfh.ch/0854/uuid2">Link2</a></p>'
      );

      const result = validator(control);

      expect(result).toBeNull();
    });

    it('should pass when link uses HTTPS protocol and is to the same project', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl('<p>HTTPS link: <a href="https://rdfh.ch/0854/someUuid">Resource</a></p>');

      const result = validator(control);

      expect(result).toBeNull();
    });

    it('should pass when content contains non-resource links', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl('<p>External link: <a href="https://www.example.com">Example</a></p>');

      const result = validator(control);

      expect(result).toBeNull();
    });
  });

  describe('Invalid cases - should return error object', () => {
    it('should fail when links to a different project', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl(
        '<p>Link to different project: <a href="http://rdfh.ch/082B/SomeResourceUuid">Resource</a></p>'
      );

      const result = validator(control);

      expect(result).not.toBeNull();
      expect(result).toEqual({
        crossProjectLink: {
          currentProject: currentProjectShortcode,
          invalidLinks: [
            {
              url: 'http://rdfh.ch/082B/SomeResourceUuid',
              shortcode: '082B',
            },
          ],
        },
      });
    });

    it('should fail when multiple links are to different projects', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl(
        '<p><a href="http://rdfh.ch/082B/uuid1">Link1</a> and <a href="http://rdfh.ch/09AB/uuid2">Link2</a></p>'
      );

      const result = validator(control);

      expect(result).not.toBeNull();
      expect(result?.['crossProjectLink'].invalidLinks).toHaveLength(2);
      expect(result?.['crossProjectLink'].invalidLinks).toEqual([
        { url: 'http://rdfh.ch/082B/uuid1', shortcode: '082B' },
        { url: 'http://rdfh.ch/09AB/uuid2', shortcode: '09AB' },
      ]);
    });

    it('should fail only for cross-project links when mixed with same-project links', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl(
        '<p><a href="http://rdfh.ch/0854/validUuid">Valid</a> and <a href="http://rdfh.ch/082B/invalidUuid">Invalid</a></p>'
      );

      const result = validator(control);

      expect(result).not.toBeNull();
      expect(result?.['crossProjectLink'].invalidLinks).toHaveLength(1);
      expect(result?.['crossProjectLink'].invalidLinks[0]).toEqual({
        url: 'http://rdfh.ch/082B/invalidUuid',
        shortcode: '082B',
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle shortcodes with lowercase letters', () => {
      const validator = crossProjectLinkValidator('0abc');
      const control = new FormControl('<p><a href="http://rdfh.ch/0ABC/uuid">Resource</a></p>');

      const result = validator(control);

      expect(result).toBeNull(); // Case-insensitive match should pass
    });

    it('should handle shortcodes with uppercase letters', () => {
      const validator = crossProjectLinkValidator('0ABC');
      const control = new FormControl('<p><a href="http://rdfh.ch/0abc/uuid">Resource</a></p>');

      const result = validator(control);

      expect(result).toBeNull(); // Case-insensitive match should pass
    });

    it('should not match malformed URLs without proper shortcode format', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl('<p><a href="http://rdfh.ch/invalid-format/uuid">Resource</a></p>');

      const result = validator(control);

      expect(result).toBeNull(); // Invalid format should not match regex
    });

    it('should not match URLs with shortcodes that are too long', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl('<p><a href="http://rdfh.ch/12345/uuid">Resource</a></p>');

      const result = validator(control);

      expect(result).toBeNull(); // 5 characters should not match (expecting 4)
    });

    it('should not match URLs with shortcodes that are too short', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl('<p><a href="http://rdfh.ch/123/uuid">Resource</a></p>');

      const result = validator(control);

      expect(result).toBeNull(); // 3 characters should not match (expecting 4)
    });

    it('should not match non-hexadecimal shortcodes', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl('<p><a href="http://rdfh.ch/XYZW/uuid">Resource</a></p>');

      const result = validator(control);

      expect(result).toBeNull(); // Non-hex characters should not match
    });

    it('should handle links without anchor tags (plain URLs in text)', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl('<p>Plain URL: http://rdfh.ch/082B/someUuid in text</p>');

      const result = validator(control);

      expect(result).not.toBeNull(); // Should still detect the URL
      expect(result?.['crossProjectLink'].invalidLinks[0].shortcode).toBe('082B');
    });

    it('should handle complex HTML with nested elements', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl(
        '<div><p>Text with <strong><a href="http://rdfh.ch/082B/uuid">nested link</a></strong></p></div>'
      );

      const result = validator(control);

      expect(result).not.toBeNull();
      expect(result?.['crossProjectLink'].invalidLinks[0].shortcode).toBe('082B');
    });

    it('should handle content with special characters and encoding', () => {
      const validator = crossProjectLinkValidator(currentProjectShortcode);
      const control = new FormControl(
        '<p>Special chars: &amp; &lt; &gt; <a href="http://rdfh.ch/082B/uuid">Link</a></p>'
      );

      const result = validator(control);

      expect(result).not.toBeNull();
      expect(result?.['crossProjectLink'].invalidLinks[0].shortcode).toBe('082B');
    });
  });
});
