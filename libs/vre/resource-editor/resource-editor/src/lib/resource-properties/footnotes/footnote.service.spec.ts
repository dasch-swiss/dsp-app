import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadValue } from '@dasch-swiss/dsp-js';
import { FootnoteService } from './footnote.service';

describe('FootnoteService', () => {
  let service: FootnoteService;
  let sanitizer: DomSanitizer;

  const mockValue = (strval?: string): ReadValue =>
    ({ id: 'http://rdfh.ch/0001/value-1', strval }) as unknown as ReadValue;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FootnoteService],
    });
    service = TestBed.inject(FootnoteService);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  describe('reloadFootnotes', () => {
    it('should parse footnotes from multiple values', () => {
      const values = [
        mockValue('text <footnote content="note1"/> more'),
        mockValue('other <footnote content="note2"/>'),
      ];

      service.reloadFootnotes(values, sanitizer);

      expect(service.footnotes.length).toBe(2);
      expect((service.footnotes[0] as any)['changingThisBreaksApplicationSecurity']).toBe('note1');
      expect((service.footnotes[1] as any)['changingThisBreaksApplicationSecurity']).toBe('note2');
    });

    it('should produce empty array when no footnotes exist', () => {
      const values = [mockValue('plain text'), mockValue('more plain text')];

      service.reloadFootnotes(values, sanitizer);

      expect(service.footnotes.length).toBe(0);
    });

    it('should skip values with undefined strval', () => {
      const values = [mockValue(undefined), mockValue('text <footnote content="note1"/>')];

      service.reloadFootnotes(values, sanitizer);

      expect(service.footnotes.length).toBe(1);
    });

    it('should reset state when called twice', () => {
      const values = [mockValue('text <footnote content="note1"/>')];

      service.reloadFootnotes(values, sanitizer);
      expect(service.footnotes.length).toBe(1);

      service.increaseReadFootnote();
      expect(service.footnoteRead).toBe(1);

      const newValues = [mockValue('text <footnote content="noteA"/> <footnote content="noteB"/>')];
      service.reloadFootnotes(newValues, sanitizer);

      expect(service.footnotes.length).toBe(2);
      expect(service.footnoteRead).toBe(0);
    });

    it('should unescape HTML entities in footnote content', () => {
      const values = [mockValue('text <footnote content="a &amp; b &lt;c&gt;"/>')];

      service.reloadFootnotes(values, sanitizer);

      expect((service.footnotes[0] as any)['changingThisBreaksApplicationSecurity']).toBe('a & b <c>');
    });
  });

  describe('increaseReadFootnote', () => {
    it('should increment footnoteRead counter', () => {
      expect(service.footnoteRead).toBe(0);

      service.increaseReadFootnote();
      expect(service.footnoteRead).toBe(1);

      service.increaseReadFootnote();
      expect(service.footnoteRead).toBe(2);
    });
  });

  describe('reloadToken', () => {
    it('should start at 0', () => {
      expect(service.reloadToken()).toBe(0);
    });

    it('should increment on each reloadFootnotes call', () => {
      service.reloadFootnotes([], sanitizer);
      expect(service.reloadToken()).toBe(1);

      service.reloadFootnotes([], sanitizer);
      expect(service.reloadToken()).toBe(2);
    });
  });
});
