import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { MediaControlService, SegmentsService } from '@dasch-swiss/vre/resource-editor/segment-support';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PointerValue } from '../av-timeline/av-timeline.component';
import { FileRepresentation } from '../file-representation';
import { MovingImageSidecar } from '../moving-image-sidecar';
import { RepresentationService } from '../representation.service';
import { MediaPlayerService } from './media-player.service';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
  providers: [MediaControlService, MediaPlayerService],
})
export class VideoComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) src!: FileRepresentation;
  @Input({ required: true }) parentResource!: ReadResource;
  @Input({ required: true }) isAdmin!: boolean;
  @Output() loaded = new EventEmitter<boolean>();

  @ViewChild('preview') preview!: ElementRef;

  start = 0;
  video?: SafeUrl;
  videoError?: string;
  timelineDimension?: DOMRect;
  myCurrentTime = 0;
  previewTime = 0;
  duration = 0;
  cinemaMode = false;
  watchForPause: number | null = null;
  isPlayerReady = false;
  fileInfo?: MovingImageSidecar;

  readonly frameWidth = 160;
  readonly halfFrameWidth: number = Math.round(this.frameWidth / 2);
  private _ngUnsubscribe = new Subject<void>();

  constructor(
    private _sanitizer: DomSanitizer,
    public _mediaControl: MediaControlService,
    private _notification: NotificationService,
    public segmentsService: SegmentsService,
    public videoPlayer: MediaPlayerService,
    private _rs: RepresentationService,
    private _cdr: ChangeDetectorRef
  ) {}

  @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.cinemaMode) {
      this.cinemaMode = false;
    }
  }

  ngOnChanges(): void {
    this._ngUnsubscribe.next();

    this._watchForMediaEvents();
    this.segmentsService.onInit(this.parentResource.id, 'VideoSegment');
    this.videoError = '';
    this.video = this._sanitizer.bypassSecurityTrustUrl(this.src.fileValue.fileUrl);
    this._rs.getFileInfo(this.src.fileValue.fileUrl).subscribe(file => {
      this.fileInfo = file as MovingImageSidecar;
    });
  }

  onVideoPlayerReady() {
    const player = document.getElementById('video') as HTMLVideoElement;

    this.videoPlayer.onInit(player);

    this.duration = this.videoPlayer.duration();
    this.isPlayerReady = true;
    this.loaded.emit(true);
    this._mediaControl.mediaDurationSecs = this.videoPlayer.duration();
    this.displayPreview(true);
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

  updatePreview(ev: PointerValue) {
    if (!this.timelineDimension) {
      return;
    }
    this.displayPreview(true);

    this.previewTime = Math.round(ev.time);

    // position from left:
    let leftPosition: number = ev.position - this.timelineDimension.x - this.halfFrameWidth;

    // prevent overflow of preview image on the left
    if (leftPosition <= 8) {
      leftPosition = 8;
    }

    // prevent overflow of preview image on the right
    if (leftPosition >= this.timelineDimension.width - this.frameWidth + 8) {
      leftPosition = this.timelineDimension.width - this.frameWidth + 8;
    }

    // set preview positon on x axis
    this.preview.nativeElement.style.left = `${leftPosition}px`;
  }

  displayPreview(status: boolean) {
    this.preview.nativeElement.style.display = status ? 'block' : 'none';
  }

  handleVideoError(event: ErrorEvent) {
    const videoElement = event.target as HTMLMediaElement;
    console.error('Video error:', videoElement.error);

    if (videoElement.error) {
      let vErr: string;
      switch (videoElement.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          vErr = 'Video playback aborted.';
          console.error(vErr);
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          vErr = 'Network error occurred while loading the video.';
          console.error(vErr);
          break;
        case MediaError.MEDIA_ERR_DECODE:
          vErr = 'Video decoding error.';
          console.error(vErr);
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          vErr = 'The video format is not supported.';
          console.error(vErr);
          break;
        default:
          vErr = 'An unknown video error occurred.';
          console.error(vErr);
          break;
      }
      this.videoError = vErr;
    }
  }

  private _watchForMediaEvents() {
    this._mediaControl.play$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(seconds => {
      if (seconds >= this.duration) {
        this._notification.openSnackBar('The video cannot be played at this time.');
        return;
      }
      this.videoPlayer.navigate(seconds);
      this.videoPlayer.play();
    });

    this._mediaControl.watchForPause$.subscribe(seconds => {
      this.watchForPause = seconds;
    });
  }
}
