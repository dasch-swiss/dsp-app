import { Component, Input } from '@angular/core';
import { ReadTextValueAsString } from '@dasch-swiss/dsp-js';
import { WithBreaksPipe } from '../../property-value/with-breaks.pipe';

@Component({
  selector: 'app-paragraph-viewer',
  imports: [WithBreaksPipe],
  template: `<span [innerHTML]="value.text | withBreaks"></span>`,
})
export class ParagraphViewerComponent {
  @Input({ required: true }) value!: ReadTextValueAsString;
}
