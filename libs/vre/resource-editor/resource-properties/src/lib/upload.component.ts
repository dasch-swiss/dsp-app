import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import {
  FileRepresentationType,
  UploadedFileResponse,
  UploadFileService,
} from '@dasch-swiss/vre/resource-editor/representations';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-upload',
  template: `
    <ng-container *ngIf="!loading; else loadingTpl">
      <div appDragDrop (click)="fileInput.click()" (fileDropped)="addFile($event.item(0))" class="zone">
        <input hidden type="file" data-cy="upload-file" (change)="addFileFromClick($event)" #fileInput />
        <mat-icon style="transform: scale(1.6); margin: 8px 0; color: gray">cloud_upload</mat-icon>
        <div class="mat-subtitle-1">Drag and drop or click to upload.</div>
        <div class="mat-subtitle-2">File types supported: {{ allowedFileTypes.join(', ') }}</div>
      </div>
    </ng-container>

    <ng-template #loadingTpl>
      <app-progress-indicator />
    </ng-template>
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
    `,
  ],
})
export class UploadComponent {
  @Input({ required: true }) representation!: FileRepresentationType;
  @Input({ required: true }) projectShortcode!: string;
  @Output() afterFileUploaded = new EventEmitter<UploadedFileResponse>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  loading = false;

  private readonly _fileTypesMapping = {
    [Constants.HasMovingImageFileValue]: ['mp4'],
    [Constants.HasAudioFileValue]: ['mp3', 'wav'],
    [Constants.HasDocumentFileValue]: ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx'],
    [Constants.HasTextFileValue]: ['csv', 'json', 'odd', 'rng', 'txt', 'xml', 'xsd', 'xsl'],
    [Constants.HasArchiveFileValue]: ['7z', 'gz', 'gzip', 'tar', 'tgz', 'z', 'zip'],
    [Constants.HasStillImageFileValue]: ['jp2', 'jpg', 'jpeg', 'png', 'tif', 'tiff'],
  } as const;

  get allowedFileTypes() {
    return this._fileTypesMapping[this.representation];
  }

  constructor(
    private _notification: NotificationService,
    private _upload: UploadFileService
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
    this._upload
      .upload(file, this.projectShortcode)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(res => {
        this.afterFileUploaded.emit(res);
      });

    this.fileInput.nativeElement.value = '';
  }
}
