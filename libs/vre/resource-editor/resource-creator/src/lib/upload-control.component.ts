import { Component, Input, Self } from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';
import { FileRepresentationType, UploadedFileResponse } from '@dasch-swiss/vre/resource-editor/representations';

@Component({
  selector: 'app-upload-control',
  template: `
    <ng-container *ngIf="!control.value; else uploadedFileTpl">
      <app-upload
        style="margin-bottom: 16px;display: block;"
        [representation]="representation"
        [projectShortcode]="projectShortcode"
        (afterFileUploaded)="afterFileUploaded($event)" />
      <mat-error *ngIf="ngControl.touched && ngControl.errors">{{ ngControl.errors | humanReadableError }}</mat-error>
    </ng-container>

    <ng-template #uploadedFileTpl>
      <app-uploaded-file
        [internalFilename]="control.value"
        [projectShortcode]="projectShortcode"
        (removeFile)="control.setValue('')" />
    </ng-template>
  `,
})
export class UploadControlComponent implements ControlValueAccessor {
  @Input({ required: true }) representation!: FileRepresentationType;
  @Input({ required: true }) projectShortcode!: string;

  loading = false;

  get control() {
    return this.ngControl['form'] as FormControl<string>;
  }

  onChange!: (value: any) => void;
  onTouched!: () => void;

  constructor(@Self() public ngControl: NgControl) {
    ngControl.valueAccessor = this;
  }

  writeValue(value: null): void {}

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  afterFileUploaded(res: UploadedFileResponse) {
    this.onChange(res.internalFilename);
    this.onTouched();
  }
}
