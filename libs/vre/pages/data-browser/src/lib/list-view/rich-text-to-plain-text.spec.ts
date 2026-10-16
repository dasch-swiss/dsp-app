import { richTextToPlainText } from './rich-text-to-plain-text';

const xml = (body: string) => `<?xml version="1.0" encoding="UTF-8"?>\n<text>${body}</text>`;

describe('richTextToPlainText', () => {
  it('drops the XML declaration and the markup', () => {
    expect(richTextToPlainText(xml('<p>A <strong>bold</strong> claim</p>'))).toBe('A bold claim');
  });

  it('separates paragraphs, list items and line breaks with a space', () => {
    expect(richTextToPlainText(xml('<p>One</p><p>Two<br/>Three</p><ul><li>Four</li><li>Five</li></ul>'))).toBe(
      'One Two Three Four Five'
    );
  });

  it('decodes entities and collapses whitespace', () => {
    expect(richTextToPlainText(xml('<p>Fish&nbsp;&amp;\n  chips</p>'))).toBe('Fish & chips');
  });

  it('leaves out footnote content', () => {
    expect(richTextToPlainText(xml('<p>Claim<footnote content="Source"/> made</p>'))).toBe('Claim made');
  });

  it('returns an empty string for empty content', () => {
    expect(richTextToPlainText(xml('<p></p>'))).toBe('');
  });
});
