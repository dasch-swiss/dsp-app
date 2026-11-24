import { Pipe, PipeTransform } from '@angular/core';

/** A piece of a text, and whether it is what was searched for. */
export interface TextPart {
  text: string;
  match: boolean;
}

/** The text cut where it has the query, in any case, so each match can be marked; the whole text without a query. */
export function highlighted(text: string, query: string): TextPart[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [{ text, match: false }];
  const parts: TextPart[] = [];
  const haystack = text.toLowerCase();
  let from = 0;
  for (let at = haystack.indexOf(needle); at >= 0; at = haystack.indexOf(needle, from)) {
    if (at > from) parts.push({ text: text.slice(from, at), match: false });
    parts.push({ text: text.slice(at, at + needle.length), match: true });
    from = at + needle.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), match: false });
  return parts;
}

/** `highlighted` in a template. */
@Pipe({ name: 'highlighted' })
export class HighlightedPipe implements PipeTransform {
  transform(text: string, query: string): TextPart[] {
    return highlighted(text, query);
  }
}

/** Whether the text has the query, in any case. */
export function hasText(text: string | undefined, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return !!needle && !!text && text.toLowerCase().includes(needle);
}
