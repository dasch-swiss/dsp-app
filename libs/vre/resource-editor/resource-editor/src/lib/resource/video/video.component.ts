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
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { TranslateService } from '@ngx-translate/core';
import { catchError, EMPTY, Subject, takeUntil } from 'rxjs';
import { MediaSliderComponent } from '../../representation/media-slider.component';
import { MovingImageSidecar } from '../../representation/moving-image-sidecar';
import { RepresentationErrorMessageComponent } from '../../representation/representation-error-message.component';
import { FileRepresentationInput, ParentResourceInput } from '../../representation/representation-inputs';
import { RepresentationService } from '../../representation/representation.service';
import { ResourceRepresentationContainerComponent } from '../../representation/resource-representation-container.component';
import { MediaControlService } from '../../representation/segments/media-control.service';
import { Segment } from '../../representation/segments/segment';
import { SegmentsDisplayComponent } from '../../representation/segments/segments-display.component';
import { SegmentsService } from '../../representation/segments/segments.service';
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
    AppProgressIndicatorComponent,
    VideoOverlayComponent,
    MediaSliderComponent,
    SegmentsDisplayComponent,
    VideoToolbarComponent,
    RepresentationErrorMessageComponent,
    ResourceRepresentationContainerComponent,
  ],
  styles: [
    `
      .video-stage {
        position: relative;
        margin-bottom: -4px;
      }

      /* Keeps a visible area for the overlaid indicator before the video reports its dimensions. */
      .video-stage.is-loading {
        min-height: 160px;
      }

      .video-loading {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class VideoComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) src!: FileRepresentationInput;
  @Input({ required: true }) parentResource!: ParentResourceInput;
  @Input() start = 0;
  @Input() overrideSegments?: Segment[];
  @Output() loaded = new EventEmitter<boolean>();

  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  video?: SafeUrl;
  videoError?: string;
  myCurrentTime = 0;
  duration = 0;
  watchForPause: number | null = null;
  /** HAVE_METADATA: duration, slider range and seeking are available, so the loading state can end. */
  isMetadataLoaded = false;
  /** HAVE_FUTURE_DATA: pressing play actually starts playback, so the transport controls may show. */
  isPlayerReady = false;
  fileInfo?: MovingImageSidecar;

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

    this.isMetadataLoaded = false;
    this.isPlayerReady = false;
    this._watchForMediaEvents();
    if (this.overrideSegments) {
      this.segmentsService.setSegments(this.overrideSegments);
    } else {
      this.segmentsService.onInit(this.parentResource.id, 'VideoSegment');
    }
    this.videoError = '';
    this.video = this._sanitizer.bypassSecurityTrustUrl(this.src.fileUrl);

    this._rs
      .getFileInfo(this.src.fileUrl)
      .pipe(
        takeUntil(this._ngUnsubscribe),
        catchError(error => {
          console.error('Failed to load file info:', error);
          return EMPTY;
        })
      )
      .subscribe(file => {
        this.fileInfo = file as MovingImageSidecar;
      });
  }

  /**
   * `loadedmetadata` (HAVE_METADATA). Everything here needs only the duration and the ability to
   * seek, both guaranteed at this readyState — so the slider, the seek target and the end of the
   * loading state need not wait for a playable buffer, which on a large file arrives much later.
   * Playability is a separate concern, tracked by `onVideoPlayerReady`. See DEV-7026.
   */
  onMetadataLoaded() {
    if (this.isMetadataLoaded) return;

    this.videoPlayer.onInit(this.videoElement.nativeElement);

    if (this.start > 0) {
      this.videoPlayer.navigate(this.start);
    }

    this.duration = this.videoPlayer.duration();
    this.mediaControl.mediaDurationSecs = this.duration;
    this.isMetadataLoaded = true;

    this.videoPlayer.onTimeUpdate$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(seconds => {
      this.myCurrentTime = seconds;
      this._cdr.detectChanges();

      if (this.watchForPause !== null && Math.floor(this.watchForPause) === Math.floor(seconds)) {
        this.videoPlayer.pause();
        this.watchForPause = null;
      }
    });
  }

  /**
   * `canplay` (HAVE_FUTURE_DATA). Gates the transport controls only: a play button must not appear
   * before pressing it starts playback. Always preceded by `loadedmetadata`, so the player service
   * is already bound to the element by the time this runs.
   */
  onVideoPlayerReady() {
    if (this.isPlayerReady) return;

    this.isPlayerReady = true;
    this.loaded.emit(true);
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
    this.segmentsService.playSegment$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(segment => {
      this.mediaControl.playMedia(segment.hasSegmentBounds.start, segment.hasSegmentBounds.end);
    });

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

    this.mediaControl.watchForPause$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(seconds => {
      this.watchForPause = seconds;
    });
  }
}
