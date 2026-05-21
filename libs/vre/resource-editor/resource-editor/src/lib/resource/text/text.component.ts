import { Component, Input } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { FileRepresentationComponent } from '../../representation/file-representation.component';
import { FileRepresentationInput, ParentResourceInput } from '../../representation/representation-inputs';

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
  @Input({ required: true }) src!: FileRepresentationInput;
  @Input({ required: true }) parentResource!: ParentResourceInput;

  readonly representationConstant = Constants.HasTextFileValue;
}
