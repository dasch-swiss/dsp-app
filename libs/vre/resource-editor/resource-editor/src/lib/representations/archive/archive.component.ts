import { Component, Input } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { FileRepresentationComponent } from '../file-representation.component';
import { FileRepresentationInput, ParentResourceInput } from '../representation-inputs';

@Component({
  selector: 'app-archive',
  imports: [FileRepresentationComponent, TranslatePipe],
  template: `
    <app-file-representation
      [src]="src"
      [parentResource]="parentResource"
      [dialogConfig]="{
        title: 'resourceEditor.representations.archive.title' | translate,
        representation: representationConstant,
      }" />
  `,
})
export class ArchiveComponent {
  @Input({ required: true }) src!: FileRepresentationInput;
  @Input({ required: true }) parentResource!: ParentResourceInput;

  readonly representationConstant = Constants.HasArchiveFileValue;
}
