import { Component, Input } from '@angular/core';
import { ReadUriValue } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-uri-viewer',
  imports: [],
  template: ` <a [href]="value.uri" target="_blank">{{ value.uri }}</a>`,
  standalone: true,
})
export class UriViewerComponent {
  @Input({ required: true }) value!: ReadUriValue;
}
