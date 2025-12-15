import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DoubleChipSelectorComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { FileRepresentationType } from '../representations/file-representation.type';
import { IiifControlComponent } from '../representations/third-party-iiif/iiif-control.component';
import {
  iiifUrlValidator,
  infoJsonUrlValidatorAsync,
  isExternalHostValidator,
  previewImageUrlValidatorAsync,
} from '../representations/third-party-iiif/iiif-url-validator';
import { CreateResourceFormRowComponent } from './create-resource-form-row.component';
import { UploadControlComponent } from './upload-control.component';

@Component({
  selector: 'app-create-resource-form-image',
  template: ` <app-create-resource-form-row
    [label]="'resourceEditor.resourceCreator.image.label' | translate"
    style="display: block; margin-bottom: 16px">
    <div style="margin-bottom: 8px; margin-top: 8px">
      <app-double-chip-selector
        data-cy="image-source-selector"
        [options]="[
          'resourceEditor.resourceCreator.image.uploadFile' | translate,
          'resourceEditor.resourceCreator.image.linkExternalIIIF' | translate,
        ]"
        [(value)]="isUploadFileTab"
        (valueChange)="onChange($event)" />
    </div>

    @if (isUploadFileTab) {
      <app-upload-control
        [formControl]="control"
        [projectShortcode]="projectShortcode"
        [representation]="fileRepresentation"
        data-cy="upload-control" />
    }

    @if (!isUploadFileTab) {
      <app-iiif-control [control]="control" />
    }
  </app-create-resource-form-row>`,
  imports: [
    CreateResourceFormRowComponent,
    DoubleChipSelectorComponent,
    UploadControlComponent,
    IiifControlComponent,
    TranslatePipe,
    ReactiveFormsModule,
  ],
})
export class CreateResourceFormImageComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input({ required: true }) projectShortcode!: string;
  @Input({ required: true }) fileRepresentation!: FileRepresentationType;

  readonly externalControlValidators = {
    validators: [Validators.required, iiifUrlValidator(), isExternalHostValidator()],
    asyncValidators: [previewImageUrlValidatorAsync(), infoJsonUrlValidatorAsync()],
  };

  isUploadFileTab = true;

  cachedValue: { upload?: string; external?: string } = { upload: undefined, external: undefined };

  onChange(isUploadFileTab: boolean) {
    if (isUploadFileTab) {
      this.cachedValue.external = this.control.value!;
      this.control.setValidators([Validators.required]);
      this.control.setValue(this.cachedValue.upload ?? null);
    } else {
      this.cachedValue.upload = this.control.value!;
      this.control.setValidators(this.externalControlValidators.validators);
      this.control.setAsyncValidators(this.externalControlValidators.asyncValidators);
      this.control.setValue(this.cachedValue.external ?? null);
    }

    this.control.updateValueAndValidity();
  }
}
