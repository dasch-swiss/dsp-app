import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import { LoadProjectAction, ProjectsSelectors, ResourceSelectors } from '@dasch-swiss/vre/core/state';
import {
  FileRepresentationType,
  UploadedFileResponse,
  UploadFileService,
} from '@dasch-swiss/vre/resource-editor/representations';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { filter, finalize, map, mergeMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-upload',
  template: `
    <ng-container *ngIf="!loading; else loadingTpl">
      <div
        *ngIf="!fileToUpload; else showFileTemplate"
        appDragDrop
        (click)="fileInput.click()"
        (fileDropped)="_addFile($event.item(0))"
        style="cursor: pointer">
        <div style="text-align: center; padding: 16px; border: 1px solid black">
          <input hidden type="file" data-cy="upload-file" (change)="addFileFromClick($event)" #fileInput />
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
    </ng-container>

    <ng-template #loadingTpl>
      <dasch-swiss-app-progress-indicator />
    </ng-template>

    <ng-template #showFileTemplate>
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
export class UploadComponent {
  @Input({ required: true }) representation!: FileRepresentationType;
  @Output() afterFileRemoved = new EventEmitter<void>();
  @Output() afterFileUploaded = new EventEmitter<UploadedFileResponse>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly Math = Math;

  fileToUpload: File | undefined;
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
    private _store: Store,
    private _upload: UploadFileService,
    private _cdr: ChangeDetectorRef,
    private _actions$: Actions
  ) {}

  addFileFromClick(event: any) {
    this._addFile(event.target.files[0]);
  }

  _addFile(file: File) {
    const regex = /\.([^.\\/:*?"<>|\r\n]+)$/;
    const supportedExtensions = file.name.match(regex);
    const fileExtension = supportedExtensions![1].toLowerCase();
    if (!supportedExtensions || !this.allowedFileTypes.some(extensions => fileExtension === extensions)) {
      this._notification.openSnackBar(`The extension ${fileExtension} is not supported.`);
      return;
    }

    this.fileToUpload = file;
    this._uploadFile(file);
  }

  private _uploadFile(file: File): void {
    this.loading = true;
    const resource = this._store.selectSnapshot(ResourceSelectors.resource);
    const project = this._store.selectSnapshot(ProjectsSelectors.contextProject);
    if (resource && !project) {
      this._actions$
        .pipe(ofActionSuccessful(LoadProjectAction))
        .pipe(take(1))
        .subscribe(() => {
          this._uploadProjectFile(file);
        });
      this._store.dispatch(new LoadProjectAction(resource.res.attachedToProject, false));
    } else {
      this._uploadProjectFile(file);
    }

    this.fileInput.nativeElement.value = '';
  }

  private _uploadProjectFile(file: File): void {
    this.loading = true;
    this._store
      .select(ProjectsSelectors.contextProject)
      .pipe(
        filter(v => v !== undefined),
        take(1),
        map(prj => prj!.shortcode),
        mergeMap(sc => {
          return this._upload.upload(file, sc);
        }),
        finalize(() => {
          this.loading = false;
          this._cdr.detectChanges();
        })
      )
      .subscribe(res => {
        this.afterFileUploaded.emit(res);
      });

    this.fileInput.nativeElement.value = '';
  }

  removeFile() {
    this.fileToUpload = undefined;
    this.afterFileRemoved.emit();
  }
}
