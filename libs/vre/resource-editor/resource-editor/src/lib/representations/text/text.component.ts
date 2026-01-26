import { Component, Input } from '@angular/core';
import { Constants, ReadResource, ReadTextFileValue } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { FileRepresentationComponent } from '../file-representation.component';

@Component({
  selector: 'app-text',
  imports: [FileRepresentationComponent, TranslatePipe],
  template: `
    <app-file-representation
      [src]="src"
      [parentResource]="parentResource"
      [dialogConfig]="{
        title: 'resourceEditor.representations.text.title' | translate,
        representation: representationConstant,
      }" />
  `,
})
export class TextComponent {
  @Input({ required: true }) src!: ReadTextFileValue;
  @Input({ required: true }) parentResource!: ReadResource;

  readonly representationConstant = Constants.HasTextFileValue;
}
