import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { unescapeHtml } from '@dasch-swiss/vre/ui/ui';
import { FootnoteService } from './footnote.service';

@Pipe({
  name: 'footnoteParser',
})
export class FootnoteParserPipe implements PipeTransform {
  private readonly _footnoteRegExp = /<footnote content="([^>]+)"\/>/g;

  constructor(
    private _sanitizer: DomSanitizer,
    private _footnoteService: FootnoteService
  ) {}

  transform(value_: null | string | SafeHtml): SafeHtml | null {
    if (value_ === null) {
      return value_; // Return as is if value is empty or null
    } // does nothing if only displayMode changes

    const value = typeof value_ === 'string' ? value_ : value_['changingThisBreaksApplicationSecurity'];
    if (!this._containsFootnote(value)) {
      return this._sanitizer.bypassSecurityTrustHtml(value);
    }

    return this._parseFootnotes(value);
  }

  private _containsFootnote(text: string) {
    return text.match(this._footnoteRegExp) !== null;
  }

  private _parseFootnotes(controlValue: string): SafeHtml {
    const matches = controlValue.matchAll(this._footnoteRegExp);
    let newValue = controlValue;
    if (matches) {
      Array.from(matches).forEach(matchArray => {
        const uuid = window.crypto.getRandomValues(new Uint32Array(1))[0].toString();
        const parsedFootnote = `<footnote content="${matchArray[1]}" id="${uuid}">${this._footnoteService.footnotes.length + 1}</footnote>`;
        newValue = newValue.replace(matchArray[0], parsedFootnote);
        this._footnoteService.addFootnote(uuid, this._sanitizer.bypassSecurityTrustHtml(unescapeHtml(matchArray[1])));
      });
    }

    return this._sanitizer.bypassSecurityTrustHtml(newValue);
  }
}
