const XML_DECLARATION = /<\?xml[^>]*\?>/;
/** Closing block tags and line breaks become a space, so "<p>a</p><p>b</p>" reads "a b", not "ab". */
const BLOCK_BOUNDARY = /<\/(p|li|h[1-6]|td|th|blockquote|pre|div)>|<br\s*\/?>/gi;

/**
 * Reduces a rich-text value (dsp-api's standard-mapping XML, as `ReadTextValue.strval`) to one
 * line of plain text. `DOMParser` with `text/html` builds an inert document: nothing is fetched or
 * run. Footnotes vanish, since their content lives in an attribute.
 */
export function richTextToPlainText(xml: string): string {
  const html = xml.replace(XML_DECLARATION, '').replace(BLOCK_BOUNDARY, ' ');
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
  return text.replace(/\s+/g, ' ').trim();
}
