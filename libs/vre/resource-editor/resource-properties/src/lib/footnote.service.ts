import { Injectable } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

@Injectable()
export class FootnoteService {
  footnotes: { uuid: string; content: SafeHtml }[] = [];

  addFootnote(uuid: string, content: SafeHtml): void {
    const property = this.footnotes.find(footnote => footnote.uuid === uuid);
    if (property) {
      property.content = content;
    } else {
      this.footnotes.push({ uuid, content });
    }
  }

  reset() {
    this.footnotes = [];
  }
}
