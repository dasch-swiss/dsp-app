import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { FileRepresentationType } from '../representations/file-representation.type';
import { CreateResourceFormImageComponent } from './create-resource-form-image.component';
import { CreateResourceFormRowComponent } from './create-resource-form-row.component';
import { UploadControlComponent } from './upload-control.component';

@Component({
  selector: 'app-create-resource-form-representation',
  template: `
    @if (fileRepresentation !== Constants.HasStillImageFileValue) {
      <app-create-resource-form-row [label]="'resourceEditor.resourceCreator.representation.file' | translate">
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
  imports: [
    CreateResourceFormRowComponent,
    UploadControlComponent,
    CreateResourceFormImageComponent,
    TranslateModule,
    ReactiveFormsModule,
  ],
})
export class CreateResourceFormRepresentationComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input({ required: true }) projectShortcode!: string;
  @Input({ required: true }) fileRepresentation!: FileRepresentationType;
  @Output() externalImageSelected = new EventEmitter<boolean>();
  protected readonly Constants = Constants;
}
