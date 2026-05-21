import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FootnoteParserPipe } from './footnote-parser.pipe';
import { FootnoteService } from './footnote.service';

describe('FootnoteParserPipe', () => {
  let pipe: FootnoteParserPipe;
  let service: FootnoteService;

  const extractHtml = (safeHtml: SafeHtml | null): string | null => {
    if (safeHtml === null) return null;
    return (safeHtml as any)['changingThisBreaksApplicationSecurity'];
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FootnoteParserPipe, FootnoteService],
    });
    pipe = TestBed.inject(FootnoteParserPipe);
    service = TestBed.inject(FootnoteService);
  });

  it('should return null for null input', () => {
    expect(pipe.transform(null, 0)).toBeNull();
  });

  it('should return sanitized HTML when no footnotes present', () => {
    const result = pipe.transform('plain text', 0);

    expect(extractHtml(result)).toBe('plain text');
  });

  it('should replace a single footnote with numbered marker', () => {
    const input = 'text <footnote content="note1"/> more';
    const result = pipe.transform(input, 0);
    const html = extractHtml(result)!;

    expect(html).toContain(`data-origin-uuid="${service.uuid}-0"`);
    expect(html).toContain('>1</footnote>');
    expect(html).not.toContain('/>');
  });

  it('should number multiple footnotes sequentially in one value', () => {
    const input = 'a <footnote content="n1"/> b <footnote content="n2"/> c';
    const result = pipe.transform(input, 0);
    const html = extractHtml(result)!;

    expect(html).toContain(`data-origin-uuid="${service.uuid}-0"`);
    expect(html).toContain('>1</footnote>');
    expect(html).toContain(`data-origin-uuid="${service.uuid}-1"`);
    expect(html).toContain('>2</footnote>');
  });

  it('should continue numbering across multiple transform calls', () => {
    const value1 = 'a <footnote content="n1"/> b <footnote content="n2"/>';
    pipe.transform(value1, 0);

    expect(service.footnoteRead).toBe(2);

    const value2 = 'c <footnote content="n3"/>';
    const result = pipe.transform(value2, 0);
    const html = extractHtml(result)!;

    expect(html).toContain(`data-origin-uuid="${service.uuid}-2"`);
    expect(html).toContain('>3</footnote>');
  });

  it('should reset numbering after service reload', () => {
    const sanitizer = TestBed.inject(DomSanitizer);
    const value1 = 'a <footnote content="n1"/> b <footnote content="n2"/>';
    pipe.transform(value1, 0);
    expect(service.footnoteRead).toBe(2);

    service.reloadFootnotes([], sanitizer);
    expect(service.footnoteRead).toBe(0);

    const value2 = 'c <footnote content="n3"/>';
    const result = pipe.transform(value2, service.reloadToken());
    const html = extractHtml(result)!;

    expect(html).toContain(`data-origin-uuid="${service.uuid}-0"`);
    expect(html).toContain('>1</footnote>');
  });

  it('should handle SafeHtml input by extracting inner value', () => {
    const sanitizer = TestBed.inject(DomSanitizer);
    const safeInput = sanitizer.bypassSecurityTrustHtml('text <footnote content="note1"/> end');
    const result = pipe.transform(safeInput, 0);
    const html = extractHtml(result)!;

    expect(html).toContain('>1</footnote>');
  });
});
