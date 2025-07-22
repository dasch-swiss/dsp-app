import { Component, Input } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {
  FileRepresentationType,
  iiifUrlValidator,
  infoJsonUrlValidatorAsync,
  isExternalHostValidator,
  previewImageUrlValidatorAsync,
} from '@dasch-swiss/vre/resource-editor/representations';

@Component({
  selector: 'app-create-resource-form-image',
  template: ` <app-create-resource-form-row [label]="'Image'" style="display: block; margin-bottom: 16px">
    <div style="margin-bottom: 8px; margin-top: 8px">
      <app-double-chip-selector
        data-cy="image-source-selector"
        [options]="['Upload file', 'Link external IIIF image']"
        [(value)]="isUploadFileTab"
        (valueChange)="onChange($event)" />
    </div>

    <app-upload-control
      *ngIf="isUploadFileTab"
      [formControl]="control"
      [projectShortcode]="projectShortcode"
      [representation]="fileRepresentation"
      data-cy="upload-control" />

    <app-iiif-control [control]="control" *ngIf="!isUploadFileTab" />
  </app-create-resource-form-row>`,
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
