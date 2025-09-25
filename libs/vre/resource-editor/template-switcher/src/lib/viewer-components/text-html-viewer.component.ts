import { Component, Input } from '@angular/core';
import { ReadTextValueAsHtml } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-text-html-viewer',
  template: `
    <div data-cy="text-html-switch" [innerHTML]="value.html | internalLinkReplacer | addTargetBlank" appMathjax></div>
  `,
  standalone: false,
})
export class TextHtmlViewerComponent {
  @Input({ required: true }) value!: ReadTextValueAsHtml;
}
