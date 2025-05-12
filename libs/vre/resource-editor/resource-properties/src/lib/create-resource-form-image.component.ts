import { Component, Input, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatChipListbox, MatChipListboxChange } from '@angular/material/chips';
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
    <mat-chip-listbox
      aria-label="File source"
      style="margin-bottom: 8px; margin-top: 8px"
      [required]="true"
      (change)="onChange($event)"
      [value]="isUploadFileTab">
      <mat-chip-option [value]="true" data-cy="upload-file-chip"> Upload file</mat-chip-option>
      <mat-chip-option [value]="false" data-cy="external-image-chip"> Link external IIIF image </mat-chip-option>
    </mat-chip-listbox>

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
  @ViewChild(MatChipListbox) matChipListbox!: MatChipListbox;

  readonly externalControlValidators = {
    validators: [Validators.required, iiifUrlValidator(), isExternalHostValidator()],
    asyncValidators: [previewImageUrlValidatorAsync(), infoJsonUrlValidatorAsync()],
  };

  isUploadFileTab = true;

  cachedValue: { upload?: string; external?: string } = { upload: undefined, external: undefined };

  onChange(event: MatChipListboxChange) {
    const isUploadFileTab = event.value as boolean | undefined;
    if (isUploadFileTab === undefined) {
      this.matChipListbox.value = this.isUploadFileTab;
      return;
    }

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

    this.isUploadFileTab = isUploadFileTab;
    this.control.updateValueAndValidity();
  }
}
