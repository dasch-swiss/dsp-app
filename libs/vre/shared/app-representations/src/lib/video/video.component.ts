import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
  Constants,
  KnoraApiConnection,
  ReadMovingImageFileValue,
  ReadResource,
  UpdateFileValue,
  UpdateResource,
  UpdateValue,
  WriteValueResponse,
} from '@dasch-swiss/dsp-js';
import { DialogComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { mergeMap } from 'rxjs/operators';
import { PointerValue } from '../av-timeline/av-timeline.component';
import { FileRepresentation } from '../file-representation';
import { RepresentationService } from '../representation.service';
import { MovingImageSidecar } from '../video-preview/video-preview.component';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
})
export class VideoComponent implements OnChanges, AfterViewInit {
  @Input() src: FileRepresentation;

  @Input() start? = 0;

  @Input() parentResource: ReadResource;

  @Output() loaded = new EventEmitter<boolean>();

  @ViewChild('videoEle') videoEle: ElementRef;

  @ViewChild('timeline') timeline: ElementRef;

  @ViewChild('progress') progress: ElementRef;

  @ViewChild('preview') preview: ElementRef;

  fileInfo: MovingImageSidecar;

  // video file url
  video: SafeUrl;

  videoError: string;

  // video information
  aspectRatio: number;

  // preview image information
  frameWidth = 160;
  halfFrameWidth: number = Math.round(this.frameWidth / 2);
  frameHeight: number;
  lastFrameNr: number;

  // preview images are organised in matrix files; we'll need the last number of those files
  matrixWidth: number = Math.round(this.frameWidth * 6);
  matrixHeight: number;
  lastMatrixNr: number;
  lastMatrixLine: number;

  // size of progress bar / timeline
  timelineDimension: DOMRect;

  // time information
  duration: number;
  currentTime: number = this.start;
  previewTime = 0;

  // seconds per pixel to calculate preview image on timeline
  secondsPerPixel: number;

  // status
  play = false;
  reachedTheEnd = false;

  // volume
  volume = 0.75;
  muted = false;

  // video player mode
  cinemaMode = false;

  // matTooltipPosition
  matTooltipPos = 'below';

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private readonly _http: HttpClient,
    private _dialog: MatDialog,
    private _sanitizer: DomSanitizer,
    private _rs: RepresentationService,
    private _notification: NotificationService
  ) {}

  @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.cinemaMode) {
      this.cinemaMode = false;
    }
  }

  ngOnChanges(): void {
    this.videoError = '';
    // set the file info first bc. browsers might queue and block requests
    // if there are already six ongoing requests
    this._rs.getFileInfo(this.src.fileValue.fileUrl).subscribe((file: MovingImageSidecar) => {
      this.fileInfo = file;
    });

    this.video = this._sanitizer.bypassSecurityTrustUrl(this.src.fileValue.fileUrl);
  }

  ngAfterViewInit() {
    this.loaded.emit(true);
  }

  /**
   * stop playing and go back to start
   */
  goToStart() {
    this.videoEle.nativeElement.pause();
    this.play = false;
    this.currentTime = 0;
    this.videoEle.nativeElement.currentTime = this.currentTime;
  }

  /**
   * toggle play / pause
   */
  togglePlay() {
    this.play = !this.play;

    if (this.play) {
      this.videoEle.nativeElement.play();
    } else {
      this.videoEle.nativeElement.pause();
    }
  }

  /**
   * toggle player size between cinema (big) and normal mode
   */
  toggleCinemaMode() {
    this.cinemaMode = !this.cinemaMode;
  }

  /**
   * update current time info and buffer size
   */
  timeUpdate() {
    // current time
    this.currentTime = this.videoEle.nativeElement.currentTime;

    let range = 0;
    const bf = this.videoEle.nativeElement.buffered;

    while (!(bf.start(range) <= this.currentTime && this.currentTime <= bf.end(range))) {
      range += 1;
    }

    if (this.currentTime === this.duration && this.play) {
      this.play = false;
      this.reachedTheEnd = true;
    } else {
      this.reachedTheEnd = false;
    }
  }

  /**
   * as soon as video has status "loadedmetadata" we're able to read
   * information about duration, video size and set volume
   *
   */
  loadedMetadata() {
    // get video duration
    this.duration = this.videoEle.nativeElement.duration;

    // set default volume
    this.videoEle.nativeElement.volume = this.volume;

    // load preview file
    this.displayPreview(true);
  }

  /**
   * what happens when video is loaded
   */
  loadedVideo() {
    this.play = !this.videoEle.nativeElement.paused;
  }

  /**
   * video navigation from button (-/+ 10 sec)
   *
   * @param range positive or negative number value
   */
  updateTimeFromButton(range: number) {
    if (range > 0 && this.currentTime > this.duration - 10) {
      this._navigate(this.duration);
    } else if (range < 0 && this.currentTime < 10) {
      this._navigate(0);
    } else {
      this._navigate(this.currentTime + range);
    }
  }

  /**
   * video navigation from timeline / progress bar
   *
   * @param ev MatSliderChange
   */
  updateTimeFromSlider(time: number) {
    this._navigate(time);
  }

  /**
   * video navigation from scroll event
   *
   * @param ev WheelEvent
   */
  updateTimeFromScroll(ev: WheelEvent) {
    ev.preventDefault();
    this._navigate(this.currentTime + ev.deltaY / 25);
  }

  /**
   * event on mouses move on timeline
   * @param ev MouseEvent
   */
  mouseMove(ev: MouseEvent) {
    this._calcPreviewTime(ev);
  }

  /**
   * show preview image during "mousemove" on progress bar / timeline
   *
   * @param  ev PointerValue
   */
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

  /**
   * show preview image or hide it
   *
   * @param status true = show ('block'), false = hide ('none')
   */
  displayPreview(status: boolean) {
    this.preview.nativeElement.style.display = status ? 'block' : 'none';
  }

  /**
   * display message to confirm the copy of the citation link (ARK URL)
   */
  openSnackBar(message: string) {
    this._notification.openSnackBar(message);
  }

  async downloadVideo(url: string) {
    const res = await this._http.get(url, { responseType: 'blob', withCredentials: true }).toPromise();
    this.downloadFile(res);
  }

  downloadFile(data) {
    const url = window.URL.createObjectURL(data);
    const e = document.createElement('a');
    e.href = url;

    // set filename
    if (this.fileInfo.originalFilename === undefined) {
      e.download = url.substring(url.lastIndexOf('/') + 1);
    } else {
      e.download = this.fileInfo.originalFilename;
    }

    document.body.appendChild(e);
    e.click();
    document.body.removeChild(e);
  }

  /**
   * opens replace file dialog
   *
   */
  openReplaceFileDialog() {
    const propId = this.parentResource.properties[Constants.HasMovingImageFileValue][0].id;

    const dialogConfig: MatDialogConfig = {
      width: '800px',
      maxHeight: '80vh',
      position: {
        top: '112px',
      },
      data: {
        mode: 'replaceFile',
        title: 'Video (mp4)',
        subtitle: 'Update the video file of this resource',
        representation: 'movingImage',
        id: propId,
      },
      disableClose: true,
    };
    const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this._replaceFile(data);
      }
    });
  }

  openVideoInNewTab(url: string) {
    window.open(url, '_blank');
  }

  /**
   * general video navigation: Update current video time from position
   *
   * @param position Pixelnumber
   */
  private _navigate(position: number) {
    this.videoEle.nativeElement.currentTime = position;
  }

  /**
   * calcs time in preview frame
   * @param ev
   */
  private _calcPreviewTime(ev: MouseEvent) {
    this.previewTime = Math.round((ev.offsetX / this.timeline.nativeElement.clientWidth) * this.duration);
    this.previewTime = this.previewTime > this.duration ? this.duration : this.previewTime;
    this.previewTime = this.previewTime < 0 ? 0 : this.previewTime;
  }

  /**
   * replaces file
   * @param file
   */
  private _replaceFile(file: UpdateFileValue) {
    this.goToStart();

    const updateRes = new UpdateResource();
    updateRes.id = this.parentResource.id;
    updateRes.type = this.parentResource.type;
    updateRes.property = Constants.HasMovingImageFileValue;
    updateRes.value = file;

    this._dspApiConnection.v2.values
      .updateValue(updateRes as UpdateResource<UpdateValue>)
      .pipe(
        mergeMap((res: WriteValueResponse) =>
          this._dspApiConnection.v2.values.getValue(this.parentResource.id, res.uuid)
        )
      )
      .subscribe((res2: ReadResource) => {
        this.src.fileValue.fileUrl = (
          res2.properties[Constants.HasMovingImageFileValue][0] as ReadMovingImageFileValue
        ).fileUrl;
        this.src.fileValue.filename = (
          res2.properties[Constants.HasMovingImageFileValue][0] as ReadMovingImageFileValue
        ).filename;
        this.src.fileValue.strval = (
          res2.properties[Constants.HasMovingImageFileValue][0] as ReadMovingImageFileValue
        ).strval;

        this.ngOnChanges();

        this.loadedMetadata();
      });
  }

  /**
   * Handle errors at playback. Display errors via error handler if there is
   * a network error or if the video format is not supported; log everything
   * to console
   * @param event: The error event coming from the media element
   */
  handleVideoError(event: ErrorEvent) {
    const videoElement = event.target as HTMLMediaElement;
    console.error('Video error:', videoElement.error);

    if (videoElement.error) {
      let vErr = '';
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
}
