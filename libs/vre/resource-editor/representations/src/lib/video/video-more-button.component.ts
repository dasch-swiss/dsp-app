import { Component, Inject, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Constants,
  KnoraApiConnection,
  ReadMovingImageFileValue,
  ReadResource,
  UpdateFileValue,
  UpdateResource,
  UpdateValue,
  WriteValueResponse,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { mergeMap } from 'rxjs/operators';
import { FileRepresentation } from '../file-representation';
import { MovingImageSidecar } from '../moving-image-sidecar';
import {
  ReplaceFileDialogComponent,
  ReplaceFileDialogProps,
} from '../replace-file-dialog/replace-file-dialog.component';
import { RepresentationService } from '../representation.service';
import { ResourceUtil } from '../resource.util';

@Component({
  selector: 'app-video-more-button',
  template: ` <button mat-icon-button [matMenuTriggerFor]="more">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #more="matMenu" class="representation-menu">
      <button mat-menu-item class="menu-content" (click)="openVideoInNewTab(this.src.fileValue.fileUrl)">
        Open video in new tab
      </button>
      <button
        mat-menu-item
        class="menu-content"
        [cdkCopyToClipboard]="this.src.fileValue.fileUrl"
        (click)="openSnackBar('URL copied to clipboard!')">
        Copy video URL to clipboard
      </button>
      <button mat-menu-item class="menu-content" (click)="downloadVideo()">Download video</button>
      <button [disabled]="!userCanEdit" mat-menu-item class="menu-content" (click)="openReplaceFileDialog()">
        Replace file
      </button>
    </mat-menu>`,
})
export class VideoMoreButtonComponent {
  @Input({ required: true }) src!: FileRepresentation;
  @Input({ required: true }) parentResource!: ReadResource;
  @Input({ required: true }) fileInfo!: MovingImageSidecar;

  get userCanEdit() {
    return ResourceUtil.userCanEdit(this.parentResource);
  }

  constructor(
    private _notification: NotificationService,
    private _dialog: MatDialog,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _rs: RepresentationService
  ) {}

  openVideoInNewTab(url: string) {
    window.open(url, '_blank');
  }

  openSnackBar(message: string) {
    this._notification.openSnackBar(message);
  }

  downloadVideo() {
    this._rs.downloadProjectFile(this.src.fileValue, this.parentResource);
  }

  openReplaceFileDialog() {
    this._dialog
      .open<ReplaceFileDialogComponent, ReplaceFileDialogProps>(ReplaceFileDialogComponent, {
        data: {
          title: 'Video',
          subtitle: 'Update the video file of this resource',
          representation: Constants.HasMovingImageFileValue,
          propId: this.parentResource.properties[Constants.HasMovingImageFileValue][0].id,
        },
        disableClose: true,
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this._replaceFile(data);
        }
      });
  }

  private _replaceFile(file: UpdateFileValue) {
    const updateRes = new UpdateResource();
    updateRes.id = this.parentResource.id;
    updateRes.type = this.parentResource.type;
    updateRes.property = Constants.HasMovingImageFileValue;
    updateRes.value = file;

    this._dspApiConnection.v2.values
      .updateValue(updateRes as UpdateResource<UpdateValue>)
      .pipe(
        mergeMap(res =>
          this._dspApiConnection.v2.values.getValue(this.parentResource.id, (res as WriteValueResponse).uuid)
        )
      )
      .subscribe(res3 => {
        const res2 = res3 as ReadResource;
        this.src.fileValue.fileUrl = (
          res2.properties[Constants.HasMovingImageFileValue][0] as ReadMovingImageFileValue
        ).fileUrl;
        this.src.fileValue.filename = (
          res2.properties[Constants.HasMovingImageFileValue][0] as ReadMovingImageFileValue
        ).filename;
        this.src.fileValue.strval = (
          res2.properties[Constants.HasMovingImageFileValue][0] as ReadMovingImageFileValue
        ).strval;

        window.location.reload();
      });
  }
}
