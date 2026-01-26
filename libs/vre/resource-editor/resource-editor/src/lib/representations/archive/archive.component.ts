import { Component, Input } from '@angular/core';
import { Constants, ReadArchiveFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { FileRepresentationComponent } from '../file-representation.component';

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
  @Input({ required: true }) src!: ReadArchiveFileValue;
  @Input({ required: true }) parentResource!: ReadResource;

  readonly representationConstant = Constants.HasArchiveFileValue;
}
