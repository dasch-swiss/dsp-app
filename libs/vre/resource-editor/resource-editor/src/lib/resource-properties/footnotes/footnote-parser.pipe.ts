import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FootnoteService } from './footnote.service';

@Pipe({
  name: 'footnoteParser',
})
export class FootnoteParserPipe implements PipeTransform {
  private readonly _footnoteRegExp = FootnoteService.FOOTNOTE_REGEXP;

  constructor(
    private readonly _sanitizer: DomSanitizer,
    private readonly _footnoteService: FootnoteService
  ) {}

  transform(value_: null | string | SafeHtml, valueIndex: number): SafeHtml | null {
    if (value_ === null) {
      return value_; // Return as is if value is empty or null
    } // does nothing if only displayMode changes

    const value =
      typeof value_ === 'string' ? value_ : (value_ as unknown as any)['changingThisBreaksApplicationSecurity'];
    if (!this._containsFootnote(value)) {
      return this._sanitizer.bypassSecurityTrustHtml(value);
    }

    return this._parseFootnotes(value, valueIndex);
  }

  private _containsFootnote(text: string) {
    return text.match(this._footnoteRegExp) !== null;
  }

  private _parseFootnotes(controlValue: string, valueIndex: number): SafeHtml {
    const matches = controlValue.matchAll(this._footnoteRegExp);

    let newValue = controlValue;
    if (matches) {
      Array.from(matches).forEach((matchArray, indexFootnote) => {
        const footnoteId = `${this._footnoteService.uuid}-${valueIndex}-${indexFootnote}`;

        const startingIndex = this._footnoteService.footnotes.findIndex(footnote => footnote.indexValue === valueIndex);

        const parsedFootnote = `<footnote content="${matchArray[1]}" data-origin-uuid="${footnoteId}">${startingIndex + indexFootnote + 1}</footnote>`;
        newValue = newValue.replace(matchArray[0], parsedFootnote);
      });
    }

    return this._sanitizer.bypassSecurityTrustHtml(newValue);
  }
}
