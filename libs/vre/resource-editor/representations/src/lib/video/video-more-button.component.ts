import { Component, Input, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadMovingImageFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { MovingImageSidecar } from '../moving-image-sidecar';
import {
  ReplaceFileDialogComponent,
  ReplaceFileDialogProps,
} from '../replace-file-dialog/replace-file-dialog.component';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';

@Component({
  selector: 'app-video-more-button',
  template: ` <button mat-icon-button [matMenuTriggerFor]="more">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #more="matMenu" class="representation-menu">
      <button mat-menu-item class="menu-content" (click)="openVideoInNewTab(this.src.fileUrl)">
        Open video in new tab
      </button>
      <button
        mat-menu-item
        class="menu-content"
        [cdkCopyToClipboard]="this.src.fileUrl"
        (click)="openSnackBar('URL copied to clipboard!')">
        Copy video URL to clipboard
      </button>
      <button mat-menu-item class="menu-content" (click)="downloadVideo()">Download video</button>
      @if (resourceFetcherService.userCanEdit$ | async) {
        <button mat-menu-item class="menu-content" (click)="openReplaceFileDialog()">Replace file</button>
      }
    </mat-menu>`,
  standalone: false,
})
export class VideoMoreButtonComponent {
  @Input({ required: true }) src!: ReadMovingImageFileValue;
  @Input({ required: true }) parentResource!: ReadResource;
  @Input({ required: true }) fileInfo!: MovingImageSidecar;

  constructor(
    private _notification: NotificationService,
    private _dialog: MatDialog,
    private _rs: RepresentationService,
    private _viewContainerRef: ViewContainerRef,
    public resourceFetcherService: ResourceFetcherService
  ) {}

  openVideoInNewTab(url: string) {
    window.open(url, '_blank');
  }

  openSnackBar(message: string) {
    this._notification.openSnackBar(message);
  }

  downloadVideo() {
    this._rs.downloadProjectFile(this.src, this.parentResource);
  }

  openReplaceFileDialog() {
    this._dialog.open<ReplaceFileDialogComponent, ReplaceFileDialogProps>(ReplaceFileDialogComponent, {
      ...DspDialogConfig.mediumDialog({
        title: 'Video',
        subtitle: 'Update the video file of this resource',
        representation: Constants.HasMovingImageFileValue,
        resource: this.parentResource,
      }),
      viewContainerRef: this._viewContainerRef,
    });
  }
}
