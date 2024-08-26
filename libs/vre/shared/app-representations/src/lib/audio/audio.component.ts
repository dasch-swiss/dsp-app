import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { MediaControlService, SegmentsService } from '@dasch-swiss/vre/shared/app-segment-support';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FileRepresentation } from '../file-representation';
import { RepresentationService } from '../representation.service';
import { MediaPlayerService } from '../video/media-player.service';

@Component({
  selector: 'app-audio',
  templateUrl: './audio.component.html',
  styleUrls: ['./audio.component.scss'],
  providers: [MediaControlService, MediaPlayerService],
})
export class AudioComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) src!: FileRepresentation;
  @Input({ required: true }) isAdmin!: boolean;
  @Input({ required: true }) parentResource!: ReadResource;

  @Output() loaded = new EventEmitter<boolean>();

  originalFilename?: string;
  failedToLoad = false;
  audioFileUrl!: SafeUrl;

  duration = 0;
  watchForPause: number | null = null;

  currentTime = 0;

  isPlayerReady = false;
  private _ngUnsubscribe = new Subject<void>();

  constructor(
    private _sanitizer: DomSanitizer,
    public segmentsService: SegmentsService,
    private _mediaControl: MediaControlService,
    private _notification: NotificationService,
    public mediaPlayer: MediaPlayerService,
    private _rs: RepresentationService,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnChanges(): void {
    this._ngUnsubscribe.next();

    this._watchForMediaEvents();
    this.audioFileUrl = this._sanitizer.bypassSecurityTrustUrl(this.src.fileValue.fileUrl);
    this.segmentsService.onInit(this.parentResource.id, 'AudioSegment');

    this._rs.getFileInfo(this.src.fileValue.fileUrl).subscribe(
      res => {
        this.originalFilename = res.originalFilename;
      },
      () => {
        this.failedToLoad = true;
      }
    );
  }

  ngOnDestroy() {
    this._ngUnsubscribe.next();
  }

  onAudioPlayerReady() {
    if (this.isPlayerReady) {
      return;
    }

    const player = document.getElementById('audio') as HTMLAudioElement;
    this.mediaPlayer.onInit(player);
    this.isPlayerReady = true;
    this.duration = this.mediaPlayer.duration();

    this.mediaPlayer.onTimeUpdate$.subscribe(v => {
      this.currentTime = v;
      this._cd.detectChanges();

      if (this.watchForPause !== null && this.watchForPause === Math.floor(this.currentTime)) {
        this.mediaPlayer.pause();
        this.watchForPause = null;
      }
    });
  }

  private _watchForMediaEvents() {
    this._mediaControl.play$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(seconds => {
      if (seconds >= this.duration) {
        this._notification.openSnackBar('The video cannot be played at this time.');
        return;
      }
      this.mediaPlayer.navigate(seconds);
      this.mediaPlayer.play();
    });

    this._mediaControl.watchForPause$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(seconds => {
      this.watchForPause = seconds;
    });
  }
}
