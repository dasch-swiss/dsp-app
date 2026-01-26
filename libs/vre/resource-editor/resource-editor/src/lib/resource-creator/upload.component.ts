import { HttpEventType } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Constants } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { DragDropDirective } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { FileRepresentationType } from '../representations/file-representation.type';
import { UploadedFileResponse } from '../representations/upload/upload-file-response.interface';
import { UploadFileService } from '../representations/upload/upload-file.service';

@Component({
  selector: 'app-upload',
  template: `
    @if (!loading) {
      <div appDragDrop (click)="fileInput.click()" (fileDropped)="addFile($event.item(0))" class="zone">
        <input hidden type="file" data-cy="upload-file" (change)="addFileFromClick($event)" #fileInput />
        <mat-icon style="transform: scale(1.6); margin: 8px 0; color: gray">cloud_upload</mat-icon>
        <div class="mat-subtitle-1">{{ 'resourceEditor.resourceCreator.upload.dragAndDrop' | translate }}</div>
        <div class="mat-subtitle-2">
          {{
            _translateService.instant('resourceEditor.resourceCreator.upload.fileTypesSupported', {
              types: allowedFileTypes.join(', '),
            })
          }}
        </div>
      </div>
    } @else {
      <div class="upload-progress">
        @if (!processing) {
          <mat-progress-bar mode="determinate" [value]="uploadProgress"></mat-progress-bar>
          <div class="progress-text">
            {{ uploadProgress + ' %' }}
          </div>
        } @else {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <div class="progress-text">{{ 'resourceEditor.resourceCreator.upload.processingFile' | translate }}</div>
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
  imports: [DragDropDirective, MatIconModule, MatProgressBarModule, TranslatePipe],
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

  readonly _translateService = inject(TranslateService);

  constructor(
    private readonly _notification: NotificationService,
    private readonly _upload: UploadFileService,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  addFileFromClick(event: any) {
    this.addFile(event.target.files[0]);
  }

  addFile(file: File) {
    const regex = /\.([^.\\/:*?"<>|\r\n]+)$/;
    const supportedExtensions = file.name.match(regex);
    const fileExtension = supportedExtensions![1].toLowerCase();
    if (!supportedExtensions || !this.allowedFileTypes.some(extensions => fileExtension === extensions)) {
      this._notification.openSnackBar(
        this._translateService.instant('resourceEditor.resourceCreator.upload.extensionNotSupported', {
          extension: fileExtension,
        })
      );
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
