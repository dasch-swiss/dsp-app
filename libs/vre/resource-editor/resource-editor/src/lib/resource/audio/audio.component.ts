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
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { catchError, EMPTY, Subject, takeUntil } from 'rxjs';
import { MediaControlService } from '../../representation/segments/media-control.service';
import { Segment } from '../../representation/segments/segment';
import { SegmentsDisplayComponent } from '../../representation/segments/segments-display.component';
import { SegmentsService } from '../../representation/segments/segments.service';
import { RepresentationErrorMessageComponent } from '../../representation/representation-error-message.component';
import { FileRepresentationInput, ParentResourceInput } from '../../representation/representation-inputs';
import { RepresentationService } from '../../representation/representation.service';
import { MediaPlayerService } from '../video/media-player.service';
import { AudioToolbarComponent } from './audio-toolbar.component';
import { MediaSliderComponent } from '../../representation/media-slider.component';

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
  @Input({ required: true }) src!: FileRepresentationInput;
  @Input({ required: true }) parentResource!: ParentResourceInput;
  @Input() start = 0;
  @Input() overrideSegments?: Segment[];

  @ViewChild('audioPlayer', { static: false }) audioPlayerRef!: ElementRef<HTMLAudioElement>;

  originalFilename?: string;
  failedToLoad = false;
  audioFileUrl!: SafeUrl;

  duration = 0;
  watchForPause: number | null = null;

  currentTime = 0;

  isPlayerReady = false;
  private _ngUnsubscribe = new Subject<void>();

  private readonly _translateService = inject(TranslateService);

  constructor(
    private readonly _sanitizer: DomSanitizer,
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

      this.audioFileUrl = this._sanitizer.bypassSecurityTrustUrl(this.src.fileUrl);

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
      if (this.overrideSegments) {
        this.segmentsService.setSegments(this.overrideSegments);
      } else {
        this.segmentsService.onInit(this.parentResource.id, 'AudioSegment');
      }
    }
  }

  ngOnDestroy() {
    this._ngUnsubscribe.complete();
  }

  onAudioPlayerReady() {
    const player = this.audioPlayerRef.nativeElement;
    this.mediaPlayer.onInit(player);
    if (this.start > 0) {
      this.mediaPlayer.navigate(this.start);
    }
    this.isPlayerReady = true;
    this.duration = this.mediaPlayer.duration();
    this._cd.detectChanges();

    this.mediaPlayer.onTimeUpdate$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(v => {
      this.currentTime = v;
      this._cd.detectChanges();

      if (this.watchForPause !== null && Math.floor(this.watchForPause) === Math.floor(this.currentTime)) {
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
    this.segmentsService.playSegment$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(segment => {
      this._mediaControl.playMedia(segment.hasSegmentBounds.start, segment.hasSegmentBounds.end);
    });

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
    this.audioFileUrl = '';
    this.isPlayerReady = false;
    this._cd.detectChanges();
  }
}
