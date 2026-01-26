import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ReadAudioFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { catchError, EMPTY, Subject, takeUntil } from 'rxjs';
import { MediaControlService } from '../../segment-support/media-control.service';
import { SegmentsDisplayComponent } from '../../segment-support/segments-display.component';
import { SegmentsService } from '../../segment-support/segments.service';
import { RepresentationErrorMessageComponent } from '../representation-error-message.component';
import { RepresentationService } from '../representation.service';
import { MediaPlayerService } from '../video/media-player.service';
import { AudioToolbarComponent } from './audio-toolbar.component';
import { MediaSliderComponent } from './media-slider.component';

@Component({
  selector: 'app-audio',
  templateUrl: './audio.component.html',
  providers: [MediaControlService, MediaPlayerService],
  imports: [
    MatIcon,
    MediaSliderComponent,
    SegmentsDisplayComponent,
    AudioToolbarComponent,
    RepresentationErrorMessageComponent,
  ],
  styles: [
    `
      :host {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class AudioComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) src!: ReadAudioFileValue;
  @Input({ required: true }) parentResource!: ReadResource;

  @ViewChild('audioPlayer', { static: false }) audioPlayerRef!: ElementRef<HTMLAudioElement>;

  originalFilename?: string;
  failedToLoad = false;
  audioFileUrl!: SafeUrl;

  duration = 0;
  watchForPause: number | null = null;

  currentTime = 0;

  isPlayerReady = false;
  private _ngUnsubscribe = new Subject<void>();
  private _currentBlobUrl: string | null = null;

  private readonly _translateService = inject(TranslateService);

  constructor(
    private readonly _sanitizer: DomSanitizer,
    private readonly _http: HttpClient,
    public segmentsService: SegmentsService,
    private readonly _mediaControl: MediaControlService,
    private readonly _notification: NotificationService,
    public mediaPlayer: MediaPlayerService,
    private readonly _rs: RepresentationService,
    private readonly _cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this._watchForMediaEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src']) {
      if (this.isPlayerReady) {
        this._resetPlayer();
      }

      // Fetch audio file as blob with credentials to ensure httpOnly cookies are sent
      this._http
        .get(this.src.fileUrl, {
          responseType: 'blob',
          withCredentials: true,
        })
        .subscribe({
          next: blob => {
            // Revoke previous blob URL to prevent memory leaks
            if (this._currentBlobUrl) {
              URL.revokeObjectURL(this._currentBlobUrl);
            }

            // Create new blob URL and store reference for cleanup
            this._currentBlobUrl = URL.createObjectURL(blob);
            this.audioFileUrl = this._sanitizer.bypassSecurityTrustUrl(this._currentBlobUrl);
            this._cd.detectChanges();
          },
          error: () => {
            this.failedToLoad = true;
            this._cd.detectChanges();
          },
        });

      this._rs
        .getFileInfo(this.src.fileUrl)
        .pipe(
          catchError(() => {
            this.failedToLoad = true;
            return EMPTY;
          })
        )
        .subscribe(res => {
          this.originalFilename = res.originalFilename;
        });
      this._cd.detectChanges();
    }

    if (changes['parentResource']) {
      this.segmentsService.onInit(this.parentResource.id, 'AudioSegment');
    }
  }

  ngOnDestroy() {
    // Revoke blob URL to prevent memory leaks
    if (this._currentBlobUrl) {
      URL.revokeObjectURL(this._currentBlobUrl);
      this._currentBlobUrl = null;
    }
    this._ngUnsubscribe.complete();
  }

  onAudioPlayerReady() {
    const player = this.audioPlayerRef.nativeElement;
    this.mediaPlayer.onInit(player);
    this.isPlayerReady = true;
    this.duration = this.mediaPlayer.duration();
    this._cd.detectChanges();

    this.mediaPlayer.onTimeUpdate$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(v => {
      this.currentTime = v;
      this._cd.detectChanges();

      if (this.watchForPause !== null && this.watchForPause === Math.floor(this.currentTime)) {
        this.mediaPlayer.pause();
        this.watchForPause = null;
      }
    });
  }

  onAudioError(event: Event) {
    const audioElement = event.target as HTMLAudioElement;
    if (audioElement.error) {
      console.error('Failed to load audio file:', {
        code: audioElement.error.code,
        message: audioElement.error.message,
      });
    }
    this.failedToLoad = true;
    this._cd.detectChanges();
  }

  private _watchForMediaEvents() {
    this._mediaControl.play$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(seconds => {
      if (seconds >= this.duration) {
        this._notification.openSnackBar(
          this._translateService.instant('resourceEditor.representations.audio.cannotPlay')
        );
        return;
      }
      this.mediaPlayer.navigate(seconds);
      this.mediaPlayer.play();
    });

    this._mediaControl.watchForPause$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(seconds => {
      this.watchForPause = seconds;
    });
  }

  private _resetPlayer() {
    this.mediaPlayer.navigateToStart();

    // Revoke blob URL before resetting to prevent memory leaks
    if (this._currentBlobUrl) {
      URL.revokeObjectURL(this._currentBlobUrl);
      this._currentBlobUrl = null;
    }

    this.audioFileUrl = '';
    this.isPlayerReady = false;
    this._cd.detectChanges();
  }
}
