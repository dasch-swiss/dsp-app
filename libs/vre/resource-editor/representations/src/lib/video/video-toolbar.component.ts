import { Component, EventEmitter, Input, Output, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { TooltipPosition } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadMovingImageFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import {
  CreateSegmentDialogComponent,
  CreateSegmentDialogProps,
} from '@dasch-swiss/vre/resource-editor/segment-support';
import { MovingImageSidecar } from '../moving-image-sidecar';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { MediaPlayerService } from './media-player.service';

@Component({
  selector: 'app-video-toolbar',
  template: ` <mat-toolbar-row style="background: black; color: white; justify-content: space-between">
    <div>
      <button
        mat-icon-button
        data-cy="play-pause-button"
        (click)="mediaPlayer.togglePlay()"
        [matTooltip]="play ? 'Pause' : 'Play'"
        [matTooltipPosition]="matTooltipPos">
        <mat-icon>{{ mediaPlayer.isPaused() ? 'play_arrow' : 'pause' }}</mat-icon>
      </button>

      <button
        mat-icon-button
        data-cy="go-to-start-button"
        (click)="goToStart()"
        matTooltip="Stop and go to start"
        [matTooltipPosition]="matTooltipPos">
        <mat-icon>skip_previous</mat-icon>
      </button>
      <!-- TODO reached the end button "replay" -->
    </div>

    <div data-cy="player-time">{{ mediaPlayer.currentTime() | appTime }}/ {{ mediaPlayer.duration() | appTime }}</div>

    <div>
      <app-video-more-button [parentResource]="parentResource" [src]="src" [fileInfo]="fileInfo" />

      @if (resourceFetcherService.userCanEdit$ | async) {
        <button
          mat-icon-button
          data-cy="timeline-button"
          (click)="createVideoSegment()"
          [matTooltip]="'resourceEditor.representations.video.createAnnotation' | translate">
          <mat-icon svgIcon="draw_region_icon" />
        </button>
      }

      <button
        mat-icon-button
        data-cy="cinema-mode-button"
        (click)="toggleCinemaMode.emit()"
        [matTooltip]="isFullscreen ? 'Default view' : 'Cinema mode'"
        [matTooltipPosition]="matTooltipPos">
        <mat-icon>{{ isFullscreen ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
      </button>
    </div>
  </mat-toolbar-row>`,
  standalone: false,
})
export class VideoToolbarComponent {
  @Input({ required: true }) src!: ReadMovingImageFileValue;
  @Input({ required: true }) parentResource!: ReadResource;
  @Input({ required: true }) fileInfo!: MovingImageSidecar;

  @Output() toggleCinemaMode = new EventEmitter<void>();

  get isFullscreen() {
    return document.fullscreenElement;
  }

  matTooltipPos: TooltipPosition = 'below';
  play = false;

  constructor(
    private _dialog: MatDialog,
    private _domSanitizer: DomSanitizer,
    public mediaPlayer: MediaPlayerService,
    private _matIconRegistry: MatIconRegistry,
    private _viewContainerRef: ViewContainerRef,
    public resourceFetcherService: ResourceFetcherService
  ) {
    this._setupCssMaterialIcon();
  }

  createVideoSegment() {
    this._dialog.open<CreateSegmentDialogComponent, CreateSegmentDialogProps>(CreateSegmentDialogComponent, {
      ...DspDialogConfig.dialogDrawerConfig(
        {
          type: 'VideoSegment',
          resource: this.parentResource,
          videoDurationSecs: this.mediaPlayer.duration(),
        },
        true
      ),
      viewContainerRef: this._viewContainerRef,
    });
  }

  goToStart() {
    this.mediaPlayer.navigate(0);
  }

  private _setupCssMaterialIcon() {
    this._matIconRegistry.addSvgIcon(
      'draw_region_icon',
      this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/draw-region-icon.svg')
    );
  }
}
