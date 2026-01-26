import { Component, Input } from '@angular/core';
import { Constants, ReadDocumentFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { FileRepresentationComponent } from '../file-representation.component';

@Component({
  selector: 'app-document',
  imports: [FileRepresentationComponent, TranslatePipe],
  template: `
    <app-file-representation
      [src]="src"
      [parentResource]="parentResource"
      [dialogConfig]="{
        title: 'resourceEditor.representations.document.title' | translate,
        representation: representationConstant,
      }" />
  `,
})
export class DocumentComponent {
  @Input({ required: true }) src!: ReadDocumentFileValue;
  @Input({ required: true }) parentResource!: ReadResource;

  readonly representationConstant = Constants.HasDocumentFileValue;
}
