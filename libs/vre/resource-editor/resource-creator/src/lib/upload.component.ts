import { HttpEventType } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import {
  FileRepresentationType,
  UploadedFileResponse,
  UploadFileService,
} from '@dasch-swiss/vre/resource-editor/representations';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-upload',
  template: `
    @if (!loading) {
      <div appDragDrop (click)="fileInput.click()" (fileDropped)="addFile($event.item(0))" class="zone">
        <input hidden type="file" data-cy="upload-file" (change)="addFileFromClick($event)" #fileInput />
        <mat-icon style="transform: scale(1.6); margin: 8px 0; color: gray">cloud_upload</mat-icon>
        <div class="mat-subtitle-1">Drag and drop or click to upload.</div>
        <div class="mat-subtitle-2">File types supported: {{ allowedFileTypes.join(', ') }}</div>
      </div>
    } @else {
      <div class="upload-progress">
        @if (!processing) {
          <mat-progress-bar mode="determinate" [value]="uploadProgress"></mat-progress-bar>
          <div class="progress-text">{{ uploadProgress }}% uploaded</div>
        } @else {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <div class="progress-text">Processing file on server...</div>
        }
      </div>
    }
  `,
  styles: [
    `
      .zone {
        cursor: pointer;
        text-align: center;
        padding: 16px;
        border: 1px gray dashed;

        &:hover {
          background: #ececec !important;
        }
      }

      .upload-progress {
        padding: 16px;
        text-align: center;
      }

      .progress-text {
        margin-top: 8px;
        font-size: 14px;
        color: #666;
      }

      mat-progress-bar {
        margin-bottom: 8px;
      }
    `,
  ],
})
export class UploadComponent {
  @Input({ required: true }) representation!: FileRepresentationType;
  @Input({ required: true }) projectShortcode!: string;
  @Output() afterFileUploaded = new EventEmitter<UploadedFileResponse>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  loading = false;
  uploadProgress = 0;
  processing = false;

  private readonly _fileTypesMapping = {
    [Constants.HasMovingImageFileValue]: ['mp4'],
    [Constants.HasAudioFileValue]: ['mp3', 'wav'],
    [Constants.HasDocumentFileValue]: ['doc', 'docx', 'epub', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx'],
    [Constants.HasTextFileValue]: ['csv', 'htm', 'html', 'json', 'odd', 'rng', 'txt', 'xml', 'xsd', 'xsl'],
    [Constants.HasArchiveFileValue]: ['7z', 'gz', 'gzip', 'tar', 'tgz', 'z', 'zip'],
    [Constants.HasStillImageFileValue]: ['jp2', 'jpg', 'jpeg', 'png', 'tif', 'tiff'],
  } as const;

  get allowedFileTypes() {
    return this._fileTypesMapping[this.representation];
  }

  constructor(
    private _notification: NotificationService,
    private _upload: UploadFileService,
    private _cdr: ChangeDetectorRef
  ) {}

  addFileFromClick(event: any) {
    this.addFile(event.target.files[0]);
  }

  addFile(file: File) {
    const regex = /\.([^.\\/:*?"<>|\r\n]+)$/;
    const supportedExtensions = file.name.match(regex);
    const fileExtension = supportedExtensions![1].toLowerCase();
    if (!supportedExtensions || !this.allowedFileTypes.some(extensions => fileExtension === extensions)) {
      this._notification.openSnackBar(`The extension ${fileExtension} is not supported.`);
      return;
    }

    this._uploadProjectFile(file);
  }

  private _uploadProjectFile(file: File): void {
    this.loading = true;
    this.uploadProgress = 0;
    this._upload
      .upload(file, this.projectShortcode)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.uploadProgress = 0;
          this.processing = false;
          this._cdr.markForCheck();
        })
      )
      .subscribe({
        next: event => {
          if (event.type === HttpEventType.UploadProgress) {
            if (event.total) {
              this.uploadProgress = Math.round((100 * event.loaded) / event.total);

              if (event.loaded === event.total) {
                this.processing = true;
              }

              this._cdr.markForCheck();
            }
          } else if (event.type === HttpEventType.Response) {
            this.afterFileUploaded.emit(event.body as UploadedFileResponse);
          }
        },
        error: () => {
          this._notification.openSnackBar('Upload failed. Please try again.');
        },
      });

    this.fileInput.nativeElement.value = '';
  }
}
