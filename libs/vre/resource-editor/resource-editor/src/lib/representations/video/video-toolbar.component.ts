import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewContainerRef } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip, TooltipPosition } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadMovingImageFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { TimePipe } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import {
  CreateSegmentDialogComponent,
  CreateSegmentDialogProps,
} from '../../segment-support/create-segment-dialog.component';
import { MovingImageSidecar } from '../moving-image-sidecar';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { MediaPlayerService } from './media-player.service';
import { VideoMoreButtonComponent } from './video-more-button.component';

@Component({
  selector: 'app-video-toolbar',
  imports: [
    AsyncPipe,
    MatIconButton,
    MatIcon,
    MatToolbarRow,
    MatTooltip,
    VideoMoreButtonComponent,
    TranslateModule,
    TimePipe,
  ],
  template: ` <mat-toolbar-row style="background: black; color: white; justify-content: space-between">
    <div>
      <button
        mat-icon-button
        data-cy="play-pause-button"
        (click)="mediaPlayer.togglePlay()"
        [matTooltip]="
          (play ? 'resourceEditor.representations.video.pause' : 'resourceEditor.representations.video.play')
            | translate
        "
        [matTooltipPosition]="matTooltipPos">
        <mat-icon>{{ mediaPlayer.isPaused() ? 'play_arrow' : 'pause' }}</mat-icon>
      </button>

      <button
        mat-icon-button
        data-cy="go-to-start-button"
        (click)="goToStart()"
        [matTooltip]="'resourceEditor.representations.video.stopAndGoToStart' | translate"
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
        [matTooltip]="
          (isFullscreen
            ? 'resourceEditor.representations.video.defaultView'
            : 'resourceEditor.representations.video.cinemaMode'
          ) | translate
        "
        [matTooltipPosition]="matTooltipPos">
        <mat-icon>{{ isFullscreen ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
      </button>
    </div>
  </mat-toolbar-row>`,
  styles: [
    `
      .mat-mdc-button-base .mat-icon {
        min-height: 0;
      }
    `,
  ],
  standalone: true,
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
    private readonly _dialog: MatDialog,
    private readonly _domSanitizer: DomSanitizer,
    public readonly mediaPlayer: MediaPlayerService,
    private readonly _matIconRegistry: MatIconRegistry,
    private readonly _viewContainerRef: ViewContainerRef,
    public readonly resourceFetcherService: ResourceFetcherService
  ) {
    this._setupCssMaterialIcon();
  }

  async createVideoSegment() {
    const projectShortcode = await firstValueFrom(this.resourceFetcherService.projectShortcode$);
    this._dialog.open<CreateSegmentDialogComponent, CreateSegmentDialogProps>(CreateSegmentDialogComponent, {
      ...DspDialogConfig.dialogDrawerConfig(
        {
          type: 'VideoSegment',
          resource: this.parentResource,
          videoDurationSecs: this.mediaPlayer.duration(),
          projectShortcode,
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
