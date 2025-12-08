import { Injectable } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

@Injectable()
export class FootnoteService {
  uuid = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(); // make the service / propertyValue unique
  footnotes: { indexValue: number; indexFootnote: number; content: SafeHtml }[] = [];

  addFootnote(indexValue: number, indexFootnote: number, content: SafeHtml) {
    this.footnotes.push({ indexValue, indexFootnote, content });
  }

  reset() {
    this.footnotes = [];
  }
}
