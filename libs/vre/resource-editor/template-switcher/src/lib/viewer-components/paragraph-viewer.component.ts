import { Component, Input } from '@angular/core';
import { ReadTextValueAsString } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-paragraph-viewer',
  template: `<span [innerHTML]="value.text | withBreaks"></span>`,
  standalone: false,
})
export class ParagraphViewerComponent {
  @Input({ required: true }) value!: ReadTextValueAsString;
}
