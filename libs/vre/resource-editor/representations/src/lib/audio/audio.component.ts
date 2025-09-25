import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ReadAudioFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { MediaControlService, SegmentsService } from '@dasch-swiss/vre/resource-editor/segment-support';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { Subject, takeUntil } from 'rxjs';
import { RepresentationService } from '../representation.service';
import { MediaPlayerService } from '../video/media-player.service';

@Component({
  selector: 'app-audio',
  templateUrl: './audio.component.html',
  providers: [MediaControlService, MediaPlayerService],
  standalone: false,
})
export class AudioComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) src!: ReadAudioFileValue;
  @Input({ required: true }) parentResource!: ReadResource;

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

  ngOnInit() {
    this._watchForMediaEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src']) {
      if (this.isPlayerReady) {
        this._resetPlayer();
      }

      this.audioFileUrl = this._sanitizer.bypassSecurityTrustUrl(this.src.fileUrl);

      this._rs.getFileInfo(this.src.fileUrl).subscribe(
        res => {
          this.originalFilename = res.originalFilename;
        },
        () => {
          this.failedToLoad = true;
        }
      );
      this._cd.detectChanges();
    }

    if (changes['parentResource']) {
      this.segmentsService.onInit(this.parentResource.id, 'AudioSegment');
    }
  }

  ngOnDestroy() {
    this._ngUnsubscribe.next();
  }

  onAudioPlayerReady() {
    const player = document.getElementById('audio') as HTMLAudioElement;
    this.mediaPlayer.onInit(player);
    this.isPlayerReady = true;
    this.duration = this.mediaPlayer.duration();
    this._cd.detectChanges();

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

  private _resetPlayer() {
    this.mediaPlayer.navigateToStart();
    this.audioFileUrl = '';
    this.isPlayerReady = false;
    this._cd.detectChanges();
  }
}
