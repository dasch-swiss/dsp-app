import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FootnoteService } from './footnote.service';

@Pipe({
  name: 'footnoteParser',
})
export class FootnoteParserPipe implements PipeTransform {
  private readonly _footnoteRegExp = /<footnote content="([^>]+)">([^<]*)<\/footnote>/g;

  constructor(
    private _sanitizer: DomSanitizer,
    private _footnoteService: FootnoteService
  ) {}

  transform(value: null | string): SafeHtml | null {
    if (value === null) {
      return value; // Return as is if value is empty or null
    } // does nothing if only displayMode changes

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
        this._footnoteService.addFootnote(
          uuid,
          this._sanitizer.bypassSecurityTrustHtml(this._unescapeHtml(this._unescapeHtml(matchArray[1])))
        );
      });
    }
    return this._sanitizer.bypassSecurityTrustHtml(this._unescapeHtml(newValue));
  }

  private _unescapeHtml(str: string) {
    const unescapeMap = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
    };
    return str.replace(/&(amp|lt|gt|quot|#039);/g, match => unescapeMap[match]);
  }
}
