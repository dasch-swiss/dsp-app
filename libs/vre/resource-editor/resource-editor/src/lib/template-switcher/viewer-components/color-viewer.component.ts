import { Component, Input } from '@angular/core';
import { ReadColorValue } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-color-viewer',
  template: ` <div
    style="width: 100px; border-radius: 4px; height: 15px; margin: 4px 0; border: 1px solid;"
    data-cy="color-box"
    [style.background-color]="value.color"></div>`,
  standalone: false,
})
export class ColorViewerComponent {
  @Input({ required: true }) value!: ReadColorValue;
}
