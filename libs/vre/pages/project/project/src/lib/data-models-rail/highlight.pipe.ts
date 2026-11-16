import { Pipe, PipeTransform } from '@angular/core';

/** A piece of a text, and whether it matches what is searched for. */
export interface TextPart {
  text: string;
  match: boolean;
}

/** The text cut where it matches any of the terms, case aside; the whole text when nothing matches. */
export function highlightParts(text: string, terms: readonly string[]): TextPart[] {
  const wanted = terms.map(term => term.trim().toLowerCase()).filter(Boolean);
  if (!text || !wanted.length) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const marked = new Array<boolean>(text.length).fill(false);
  for (const term of wanted) {
    for (let at = lower.indexOf(term); at >= 0; at = lower.indexOf(term, at + term.length)) {
      marked.fill(true, at, at + term.length);
    }
  }
  const parts: TextPart[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts.at(-1);
    if (last && last.match === marked[i]) last.text += text[i];
    else parts.push({ text: text[i], match: marked[i] });
  }
  return parts;
}

/** Cuts a text into the parts that match the terms and those that do not, to mark the matches. */
@Pipe({ name: 'highlight' })
export class HighlightPipe implements PipeTransform {
  transform(text: string, terms: readonly string[]): TextPart[] {
    return highlightParts(text, terms);
  }
}
