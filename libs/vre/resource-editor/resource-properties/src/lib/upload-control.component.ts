import { ChangeDetectorRef, Component, Input, Self } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { FileRepresentationType, UploadedFileResponse } from '@dasch-swiss/vre/resource-editor/representations';

@Component({
  selector: 'app-upload-control',
  template: `
    <app-upload
      style="margin-bottom: 16px;display: block;"
      [representation]="representation"
      (afterFileRemoved)="removeFile()"
      (afterFileUploaded)="afterFileUploaded($event)" />
    <mat-error *ngIf="ngControl.touched && ngControl.errors">{{ ngControl.errors | humanReadableError }}</mat-error>
  `,
})
export class UploadControlComponent implements ControlValueAccessor {
  @Input() resourceId?: string;
  @Input({ required: true }) representation!: FileRepresentationType;

  onChange!: (value: any) => void;
  onTouched!: () => void;

  loading = false;

  constructor(
    private _cdr: ChangeDetectorRef,
    @Self() public ngControl: NgControl
  ) {
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

    this._cdr.detectChanges();
  }

  removeFile() {
    this.ngControl.control!.setValue(null);
    this.ngControl.control!.markAsUntouched();
  }
}
