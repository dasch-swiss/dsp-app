import { ChangeDetectorRef, Component, ElementRef, Input, Self, ViewChild } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
  Constants,
  CreateArchiveFileValue,
  CreateAudioFileValue,
  CreateDocumentFileValue,
  CreateFileValue,
  CreateMovingImageFileValue,
  CreateStillImageFileValue,
  CreateTextFileValue,
} from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { UploadFileService } from '@dasch-swiss/vre/shared/app-representations';
import { LoadProjectAction, ProjectsSelectors, ResourceSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Actions, Store, ofActionSuccessful } from '@ngxs/store';
import { filter, finalize, map, mergeMap, take } from 'rxjs/operators';
import { FileRepresentationType } from './file-representation.type';

@Component({
  selector: 'app-upload-2',
  template: `
    <ng-container *ngIf="!loading; else loadingTpl">
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
      <mat-error *ngIf="ngControl.touched && ngControl.errors">{{ ngControl.errors | humanReadableError }} </mat-error>
    </ng-container>

    <ng-template #loadingTpl>
      <dasch-swiss-app-progress-indicator />
    </ng-template>

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
  loading = false;

  onChange!: (value: any) => void;
  onTouched!: () => void;

  private readonly _fileTypesMapping = {
    [Constants.HasMovingImageFileValue]: ['mp4'],
    [Constants.HasAudioFileValue]: ['mp3', 'wav'],
    [Constants.HasDocumentFileValue]: ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx'],
    [Constants.HasTextFileValue]: ['csv', 'odd', 'rng', 'txt', 'xml', 'xsd', 'xsl'],
    [Constants.HasArchiveFileValue]: ['7z', 'gz', 'gzip', 'tar', 'tgz', 'z', 'zip'],
    [Constants.HasStillImageFileValue]: ['jp2', 'jpg', 'jpeg', 'png', 'tif', 'tiff'],
  } as const;

  get allowedFileTypes() {
    return this._fileTypesMapping[this.representation];
  }

  constructor(
    private _notification: NotificationService,
    private _upload: UploadFileService,
    private _sanitizer: DomSanitizer,
    private _cdr: ChangeDetectorRef,
    private _store: Store,
    private _actions$: Actions,
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
    this.loading = true;
    const resource = this._store.selectSnapshot(ResourceSelectors.resource);
    const project = this._store.selectSnapshot(ProjectsSelectors.contextProject);
    if (resource && !project) {
      this._actions$
        .pipe(ofActionSuccessful(LoadProjectAction))
        .pipe(take(1))
        .subscribe(() => {
          const contextProject = this._store.selectSnapshot(ProjectsSelectors.contextProject);
          this._uploadProjectFile(file);
        });
      this._store.dispatch([new LoadProjectAction(resource.res.attachedToProject, false)]);
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
        switch (this.representation) {
          case Constants.HasStillImageFileValue:
            this.previewUrl = this._sanitizer.bypassSecurityTrustUrl(res.thumbnailUrl);
            break;
          case Constants.HasDocumentFileValue:
            this.previewUrl = res.baseUrl;
            break;
        }

        const createFile = this._createFileValue;
        createFile.filename = res.internalFilename;
        this.onChange(createFile);
        this.onTouched();

        this._cdr.detectChanges();
      });

    this.fileInput.nativeElement.value = '';
  }

  private get _createFileValue(): CreateFileValue {
    switch (this.representation) {
      case Constants.HasStillImageFileValue:
        return new CreateStillImageFileValue();
      case Constants.HasMovingImageFileValue:
        return new CreateMovingImageFileValue();
      case Constants.HasAudioFileValue:
        return new CreateAudioFileValue();
      case Constants.HasDocumentFileValue:
        return new CreateDocumentFileValue();
      case Constants.HasTextFileValue:
        return new CreateTextFileValue();
      case Constants.HasArchiveFileValue:
        return new CreateArchiveFileValue();
      default:
        throw new Error(`File type ${this.representation} not supported`);
    }
  }
}
