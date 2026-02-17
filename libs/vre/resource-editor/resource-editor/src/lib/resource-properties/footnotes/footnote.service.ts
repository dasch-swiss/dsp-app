import { Injectable, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReadValue } from '@dasch-swiss/dsp-js';
import { unescapeHtml } from '@dasch-swiss/vre/ui/ui';

@Injectable()
export class FootnoteService {
  static readonly FOOTNOTE_REGEXP = /<footnote content="([^>]+)"\/>/g;
  uuid = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(); // make the service / propertyValue unique
  footnotes: SafeHtml[] = [];

  private _footnoteRead = 0;
  reloadToken = signal(0); // used to update footnote-parser pipe

  get footnoteRead(): number {
    return this._footnoteRead;
  }

  reloadFootnotes(values: ReadValue[], sanitizer: DomSanitizer) {
    this._reset();
    values.forEach(value => {
      if (value.strval === undefined) return;
      const matches = value.strval.matchAll(FootnoteService.FOOTNOTE_REGEXP);
      Array.from(matches).forEach(match => {
        this._addFootnote(sanitizer.bypassSecurityTrustHtml(unescapeHtml(match[1])));
      });
    });
    this.reloadToken.update(v => v + 1);
  }

  private _reset() {
    this.footnotes = [];
    this._footnoteRead = 0;
  }

  increaseReadFootnote() {
    this._footnoteRead++;
  }
  private _addFootnote(content: SafeHtml) {
    this.footnotes.push(content);
  }
}
