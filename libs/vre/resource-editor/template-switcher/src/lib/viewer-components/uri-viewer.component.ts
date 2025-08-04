import { Component, Input } from '@angular/core';
import { ReadUriValue } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-uri-viewer',
  template: ` <a [href]="value.uri" target="_blank">{{ value.uri }}</a>`,
})
export class UriViewerComponent {
  @Input({ required: true }) value!: ReadUriValue;
}
