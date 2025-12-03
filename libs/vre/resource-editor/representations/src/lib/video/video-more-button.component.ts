import { Component, inject, Input, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadMovingImageFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
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
        {{ 'resourceEditor.representations.video.openInNewTab' | translate }}
      </button>
      <button
        mat-menu-item
        class="menu-content"
        [cdkCopyToClipboard]="this.src.fileUrl"
        (click)="openSnackBar(_translateService.instant('resourceEditor.representations.video.urlCopied'))">
        {{ 'resourceEditor.representations.video.copyUrl' | translate }}
      </button>
      <button mat-menu-item class="menu-content" (click)="downloadVideo()">
        {{ 'resourceEditor.representations.video.download' | translate }}
      </button>
      @if (resourceFetcherService.userCanEdit$ | async) {
        <button mat-menu-item class="menu-content" (click)="openReplaceFileDialog()">
          {{ 'resourceEditor.representations.replaceFile' | translate }}
        </button>
      }
    </mat-menu>`,
  standalone: false,
})
export class VideoMoreButtonComponent {
  @Input({ required: true }) src!: ReadMovingImageFileValue;
  @Input({ required: true }) parentResource!: ReadResource;
  @Input({ required: true }) fileInfo!: MovingImageSidecar;

  readonly _translateService = inject(TranslateService);

  constructor(
    private readonly _notification: NotificationService,
    private readonly _dialog: MatDialog,
    private readonly _rs: RepresentationService,
    private readonly _viewContainerRef: ViewContainerRef,
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
        title: this._translateService.instant('resourceEditor.representations.video.title'),
        subtitle: this._translateService.instant('resourceEditor.representations.video.updateFile'),
        representation: Constants.HasMovingImageFileValue,
        resource: this.parentResource,
      }),
      viewContainerRef: this._viewContainerRef,
    });
  }
}
