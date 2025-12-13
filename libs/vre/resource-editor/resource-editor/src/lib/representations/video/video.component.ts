import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ReadMovingImageFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { StatusComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { MediaControlService } from '../../segment-support/media-control.service';
import { SegmentsDisplayComponent } from '../../segment-support/segments-display.component';
import { SegmentsService } from '../../segment-support/segments.service';
import { MediaSliderComponent } from '../audio/media-slider.component';
import { MovingImageSidecar } from '../moving-image-sidecar';
import { RepresentationService } from '../representation.service';
import { DisableContextMenuDirective } from './disable-context-menu.directive';
import { MediaPlayerService } from './media-player.service';
import { VideoOverlayComponent } from './video-overlay.component';
import { VideoToolbarComponent } from './video-toolbar.component';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  providers: [MediaControlService, MediaPlayerService],
  imports: [
    DisableContextMenuDirective,
    StatusComponent,
    AppProgressIndicatorComponent,
    VideoOverlayComponent,
    MediaSliderComponent,
    SegmentsDisplayComponent,
    VideoToolbarComponent,
  ],
})
export class VideoComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) src!: ReadMovingImageFileValue;
  @Input({ required: true }) parentResource!: ReadResource;
  @Output() loaded = new EventEmitter<boolean>();

  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

  start = 0;
  video?: SafeUrl;
  videoError?: string;
  timelineDimension?: DOMRect;
  myCurrentTime = 0;
  previewTime = 0;
  duration = 0;
  watchForPause: number | null = null;
  isPlayerReady = false;
  fileInfo?: MovingImageSidecar;

  readonly frameWidth = 160;
  readonly halfFrameWidth: number = Math.round(this.frameWidth / 2);
  private _ngUnsubscribe = new Subject<void>();

  private readonly _translateService = inject(TranslateService);

  get isFullscreen(): boolean {
    return !!document.fullscreenElement;
  }

  constructor(
    private readonly _sanitizer: DomSanitizer,
    public mediaControl: MediaControlService,
    private readonly _notification: NotificationService,
    public segmentsService: SegmentsService,
    public videoPlayer: MediaPlayerService,
    private readonly _rs: RepresentationService,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(): void {
    this._ngUnsubscribe.next();

    this._watchForMediaEvents();
    this.segmentsService.onInit(this.parentResource.id, 'VideoSegment');
    this.videoError = '';
    this.video = this._sanitizer.bypassSecurityTrustUrl(this.src.fileUrl);
    this._rs.getFileInfo(this.src.fileUrl).subscribe(file => {
      this.fileInfo = file as MovingImageSidecar;
    });
  }

  onVideoPlayerReady() {
    const player = document.getElementById('video') as HTMLVideoElement;

    this.videoPlayer.onInit(player);

    this.duration = this.videoPlayer.duration();
    this.isPlayerReady = true;
    this.loaded.emit(true);
    this.mediaControl.mediaDurationSecs = this.videoPlayer.duration();
    this.videoPlayer.onTimeUpdate$.subscribe(seconds => {
      this.myCurrentTime = seconds;
      this._cdr.detectChanges();

      if (this.watchForPause !== null && this.watchForPause === Math.floor(seconds)) {
        this.videoPlayer.pause();
        this.watchForPause = null;
      }
    });
  }

  ngOnDestroy() {
    this._ngUnsubscribe.next();
  }

  handleVideoError(event: ErrorEvent) {
    const videoElement = event.target as HTMLMediaElement;
    console.error('Video error:', videoElement.error);

    if (videoElement.error) {
      let vErr: string;
      switch (videoElement.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          vErr = this._translateService.instant('resourceEditor.representations.video.errors.playbackAborted');
          console.error(vErr);
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          vErr = this._translateService.instant('resourceEditor.representations.video.errors.networkError');
          console.error(vErr);
          break;
        case MediaError.MEDIA_ERR_DECODE:
          vErr = this._translateService.instant('resourceEditor.representations.video.errors.decodingError');
          console.error(vErr);
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          vErr = this._translateService.instant('resourceEditor.representations.video.errors.formatNotSupported');
          console.error(vErr);
          break;
        default:
          vErr = this._translateService.instant('resourceEditor.representations.video.errors.unknownError');
          console.error(vErr);
          break;
      }
      this.videoError = vErr;
    }
  }

  toggleCinemaMode() {
    const video = this.videoElement.nativeElement;
    if (this.isFullscreen) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  }

  private _watchForMediaEvents() {
    this.mediaControl.play$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(seconds => {
      if (seconds >= this.duration) {
        this._notification.openSnackBar(
          this._translateService.instant('resourceEditor.representations.video.cannotPlay')
        );
        return;
      }
      this.videoPlayer.navigate(seconds);
      this.videoPlayer.play();
    });

    this.mediaControl.watchForPause$.subscribe(seconds => {
      this.watchForPause = seconds;
    });
  }
}
