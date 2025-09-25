import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Constants } from '@dasch-swiss/dsp-js';
import { FileRepresentationType } from '@dasch-swiss/vre/resource-editor/representations';

@Component({
  selector: 'app-create-resource-form-representation',
  template: `
    @if (fileRepresentation !== Constants.HasStillImageFileValue) {
      <app-create-resource-form-row [label]="'File'">
        <app-upload-control
          [formControl]="control"
          [projectShortcode]="projectShortcode"
          [representation]="fileRepresentation"
          style="display: block; margin-bottom: 16px" />
      </app-create-resource-form-row>
    } @else {
      <app-create-resource-form-image
        [control]="control"
        [fileRepresentation]="fileRepresentation"
        [projectShortcode]="projectShortcode" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CreateResourceFormRepresentationComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input({ required: true }) projectShortcode!: string;
  @Input({ required: true }) fileRepresentation!: FileRepresentationType;
  @Output() externalImageSelected = new EventEmitter<boolean>();
  protected readonly Constants = Constants;
}
