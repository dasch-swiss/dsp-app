import { HttpClient } from '@angular/common/http';
import { Component, Inject, Input } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
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
import { ResourceUtil } from '@dasch-swiss/vre/shared/app-common';
import { DialogComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { mergeMap } from 'rxjs/operators';
import { FileRepresentation } from '../file-representation';
import { MovingImageSidecar } from '../moving-image-sidecar';

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
      <button mat-menu-item class="menu-content" (click)="downloadVideo(this.src.fileValue.fileUrl)">
        Download video
      </button>
      <button [disabled]="!userCanEdit" mat-menu-item class="menu-content" (click)="openReplaceFileDialog()">
        Replace file
      </button>
    </mat-menu>`,
})
export class VideoMoreButtonComponent {
  @Input({ required: true }) src!: FileRepresentation;
  @Input({ required: true }) resource!: ReadResource;
  @Input({ required: true }) fileInfo!: MovingImageSidecar;

  get userCanEdit() {
    return ResourceUtil.userCanEdit(this.resource);
  }

  constructor(
    private _notification: NotificationService,
    private _dialog: MatDialog,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private readonly _http: HttpClient
  ) {}

  openVideoInNewTab(url: string) {
    window.open(url, '_blank');
  }

  openSnackBar(message: string) {
    this._notification.openSnackBar(message);
  }

  async downloadVideo(url: string) {
    const res = await this._http.get(url, { responseType: 'blob', withCredentials: true }).toPromise();
    this._downloadFile(res);
  }

  openReplaceFileDialog() {
    const propId = this.resource.properties[Constants.HasMovingImageFileValue][0].id;

    const dialogConfig: MatDialogConfig = {
      width: '800px',
      maxHeight: '80vh',
      position: {
        top: '112px',
      },
      data: {
        mode: 'replaceFile',
        title: 'Video (mp4)',
        subtitle: 'Update the video file of this resource',
        representation: 'movingImage',
        id: propId,
      },
      disableClose: true,
    };
    const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this._replaceFile(data);
      }
    });
  }

  private _replaceFile(file: UpdateFileValue) {
    const updateRes = new UpdateResource();
    updateRes.id = this.resource.id;
    updateRes.type = this.resource.type;
    updateRes.property = Constants.HasMovingImageFileValue;
    updateRes.value = file;

    this._dspApiConnection.v2.values
      .updateValue(updateRes as UpdateResource<UpdateValue>)
      .pipe(
        mergeMap(res => this._dspApiConnection.v2.values.getValue(this.resource.id, (res as WriteValueResponse).uuid))
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

  private _downloadFile(data: Blob) {
    const url = window.URL.createObjectURL(data);
    const linkElement = document.createElement('a');
    linkElement.href = url;

    if (this.fileInfo?.originalFilename === undefined) {
      linkElement.download = url.substring(url.lastIndexOf('/') + 1);
    } else {
      linkElement.download = this.fileInfo.originalFilename;
    }

    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  }
}
