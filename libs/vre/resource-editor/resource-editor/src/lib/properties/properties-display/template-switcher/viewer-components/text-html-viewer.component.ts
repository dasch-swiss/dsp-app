import { Component, Input } from '@angular/core';
import { ReadTextValueAsHtml } from '@dasch-swiss/dsp-js';
import { AddTargetBlankPipe, InternalLinkReplacerPipe } from '@dasch-swiss/vre/ui/ui';
import { MathJaxDirective } from '../mathjax/math-jax.directive';

@Component({
  selector: 'app-text-html-viewer',
  imports: [InternalLinkReplacerPipe, AddTargetBlankPipe, MathJaxDirective],
  template: `
    <div data-cy="text-html-switch" [innerHTML]="value.html | internalLinkReplacer | addTargetBlank" appMathjax></div>
  `,
})
export class TextHtmlViewerComponent {
  @Input({ required: true }) value!: ReadTextValueAsHtml;
}
