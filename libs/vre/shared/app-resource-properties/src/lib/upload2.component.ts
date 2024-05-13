import { ChangeDetectorRef, Component, ElementRef, Input, Self, ViewChild } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Constants } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { FileRepresentationType } from './file-representation.type';
import { fileValueMapping } from './file-value-mapping';
import { UploadedFileResponse, UploadFileService } from './upload-file.service';

@Component({
  selector: 'app-upload-2',
  template: `
    <div
      *ngIf="ngControl.value === null; else showFileTemplate"
      appDragDrop
      (click)="fileInput.click()"
      (fileDropped)="_addFile($event.item(0))"
      style="cursor: pointer">
      <div
        style="text-align: center;
    padding: 16px; border: 1px solid black">
        <input hidden type="file" (change)="addFileFromClick($event)" #fileInput />
        <mat-icon style="transform: scale(1.6); margin: 8px 0;">cloud_upload</mat-icon>
        <div>Upload file</div>
        <div class="mat-subtitle-2">
          The following file types are supported: <br />{{ allowedFileTypes.join(', ') }}
        </div>
      </div>
      <div class="mat-subtitle-2" style="background: black; color: white; text-align: center; padding: 8px">
        Drag and drop or click to upload
      </div>
    </div>
    <mat-error *ngIf="ngControl.touched && ngControl.errors">{{ ngControl.errors | humanReadableError }}</mat-error>

    <ng-template #showFileTemplate>
      <div *ngIf="previewUrl" style="display: flex; justify-content: center">
        <img [src]="previewUrl" alt="File Preview" style="max-width: 100%; max-height: 200px; margin-bottom: 16px" />
      </div>
      <table *ngIf="fileToUpload" style="text-align: center; width: 100%; border: 1px solid lightgray">
        <tr style="background: lightblue">
          <th>Name</th>
          <th>Size</th>
          <th>Last Modified Date</th>
          <th>Delete</th>
        </tr>
        <tr>
          <td>{{ fileToUpload.name }}</td>
          <td>{{ Math.floor(fileToUpload.size / 1000) }} kb</td>
          <td>{{ fileToUpload.lastModified | date }}</td>
          <td>
            <button mat-icon-button (click)="removeFile()">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </tr>
      </table>
    </ng-template>
  `,
  styles: ['td {padding: 8px; text-align: center}'],
})
export class Upload2Component implements ControlValueAccessor {
  @Input({ required: true }) representation!: FileRepresentationType;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly Math = Math;

  previewUrl: SafeUrl | null = null;
  fileToUpload: File | undefined;

  onChange!: (value: any) => void;
  onTouched!: () => void;

  get allowedFileTypes() {
    return fileValueMapping.get(this.representation)!.fileTypes;
  }

  constructor(
    private _notification: NotificationService,
    private _upload: UploadFileService,
    private _sanitizer: DomSanitizer,
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

  addFileFromClick(event: any) {
    this._addFile(event.target.files[0]);
  }

  _addFile(file: File) {
    const regex = /\.([^.\\/:*?"<>|\r\n]+)$/;
    const match = file.name.match(regex);
    const fileExtension = match![1];
    if (!match || !this.allowedFileTypes.some(allowedFileExtension => fileExtension === allowedFileExtension)) {
      this._notification.openSnackBar(`The extension ${fileExtension} is not supported`);
      return;
    }

    this.fileToUpload = file;
    this._uploadFile(file);
  }

  removeFile() {
    this.ngControl.control!.setValue(null);
    this.ngControl.control!.markAsUntouched();
  }

  private _uploadFile(file: File): void {
    const formData = new FormData();
    formData.append(file.name, file);

    this._upload.upload(formData).subscribe((res: UploadedFileResponse) => {
      switch (this.representation) {
        case Constants.HasStillImageFileValue:
          this.previewUrl = this._sanitizer.bypassSecurityTrustUrl(
            `${res.uploadedFiles[0].temporaryUrl}/full/256,/0/default.jpg`
          );
          break;
        case Constants.HasDocumentFileValue:
          this.previewUrl = res.uploadedFiles[0].temporaryUrl;
          break;
      }

      // eslint-disable-next-line new-cap
      const fileResponse = new (fileValueMapping.get(this.representation)!.UploadClass)();
      fileResponse.filename = res.uploadedFiles[0].internalFilename;
      this.onChange(fileResponse);
      this.onTouched();

      this._cdr.detectChanges();
    });

    this.fileInput.nativeElement.value = '';
  }
}
