import { ChangeDetectorRef, Component, Input, Self } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { FileRepresentationType, UploadedFileResponse } from '@dasch-swiss/vre/resource-editor/representations';
import { fileValueMapping } from './file-value-mapping';

@Component({
  selector: 'app-upload-control',
  template: `
    <app-upload
      [representation]="representation"
      (afterFileRemoved)="removeFile()"
      (afterFileUploaded)="afterFileUploaded($event)"
      *ngIf="!loading; else loadingTpl" />
    <mat-error *ngIf="ngControl.touched && ngControl.errors">{{ ngControl.errors | humanReadableError }}</mat-error>

    <ng-template #loadingTpl>
      <app-progress-indicator />
    </ng-template>
  `,
})
export class UploadControlComponent implements ControlValueAccessor {
  @Input() resourceId?: string;
  @Input({ required: true }) representation!: FileRepresentationType;

  onChange!: (value: any) => void;
  onTouched!: () => void;

  loading = false;
  file: File | null = null;

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
    if (this.resourceId) {
      const uploadedFile = fileValueMapping.get(this.representation)!.update();
      uploadedFile.id = this.resourceId;
      uploadedFile.filename = res.internalFilename;
      this.onChange(uploadedFile);
    } else {
      const createFile = fileValueMapping.get(this.representation)!.create();
      createFile.filename = res.internalFilename;
      this.onChange(createFile);
    }
    this.onTouched();

    this._cdr.detectChanges();
  }

  removeFile() {
    this.ngControl.control!.setValue(null);
    this.ngControl.control!.markAsUntouched();
  }
}
