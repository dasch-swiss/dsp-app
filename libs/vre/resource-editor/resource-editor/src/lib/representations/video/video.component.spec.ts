// jsdom does not define MediaError — provide the numeric constants used in VideoComponent
(globalThis as any).MediaError = {
  MEDIA_ERR_ABORTED: 1,
  MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_DECODE: 3,
  MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
};

import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadMovingImageFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, EMPTY, of, Subject } from 'rxjs';
import { MediaControlService } from '../../segment-support/media-control.service';
import { SegmentsService } from '../../segment-support/segments.service';
import { RepresentationService } from '../representation.service';
import { MediaPlayerService } from './media-player.service';
import { VideoComponent } from './video.component';

const makeSrc = (): ReadMovingImageFileValue =>
  ({ fileUrl: 'http://example.org/video.mp4' }) as unknown as ReadMovingImageFileValue;

const makeParentResource = (id = 'http://r/resource'): ReadResource =>
  ({ id, properties: {} }) as unknown as ReadResource;

describe('VideoComponent — behavior', () => {
  let component: VideoComponent;
  let fixture: ComponentFixture<VideoComponent>;
  let segmentsServiceMock: jest.Mocked<Pick<SegmentsService, 'onInit' | 'playSegment$'>>;
  let mediaControlMock: jest.Mocked<
    Pick<MediaControlService, 'playMedia' | 'play$' | 'watchForPause$' | 'mediaDurationSecs'>
  >;
  let mediaPlayerMock: jest.Mocked<
    Pick<MediaPlayerService, 'navigate' | 'play' | 'pause' | 'duration' | 'onTimeUpdate$'>
  >;
  let representationServiceMock: jest.Mocked<Pick<RepresentationService, 'getFileInfo'>>;
  let notificationMock: jest.Mocked<Pick<NotificationService, 'openSnackBar'>>;
  let playSegment$: Subject<{ hasSegmentBounds: { start: number; end: number } }>;
  let play$: Subject<number>;
  let watchForPause$: Subject<number>;

  beforeEach(async () => {
    playSegment$ = new Subject();
    play$ = new Subject();
    watchForPause$ = new Subject();

    segmentsServiceMock = {
      onInit: jest.fn(),
      playSegment$: playSegment$.asObservable(),
    };
    mediaControlMock = {
      playMedia: jest.fn(),
      play$: play$.asObservable(),
      watchForPause$: watchForPause$.asObservable(),
      mediaDurationSecs: undefined,
    };
    mediaPlayerMock = {
      navigate: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      duration: jest.fn().mockReturnValue(300),
      onTimeUpdate$: new BehaviorSubject(0).asObservable(),
    };
    representationServiceMock = {
      getFileInfo: jest.fn().mockReturnValue(EMPTY),
    };
    notificationMock = { openSnackBar: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [VideoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService()],
    })
      .overrideComponent(VideoComponent, {
        set: {
          template: '<div></div>',
          providers: [
            { provide: SegmentsService, useFactory: () => segmentsServiceMock },
            { provide: MediaControlService, useFactory: () => mediaControlMock },
            { provide: MediaPlayerService, useFactory: () => mediaPlayerMock },
            { provide: RepresentationService, useValue: representationServiceMock },
            { provide: NotificationService, useValue: notificationMock },
            { provide: DomSanitizer, useValue: { bypassSecurityTrustUrl: (url: string) => url } },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(VideoComponent);
    component = fixture.componentInstance;
    component.src = makeSrc();
    component.parentResource = makeParentResource();
    component.ngOnChanges({
      src: new SimpleChange(null, component.src, true),
      parentResource: new SimpleChange(null, component.parentResource, true),
    });
    fixture.detectChanges();
  });

  describe('when the video loads', () => {
    it('loads segments for the parent resource', () => {
      expect(segmentsServiceMock.onInit).toHaveBeenCalledWith('http://r/resource', 'VideoSegment');
    });
  });

  describe('when a segment is selected for playback', () => {
    it('requests the media player to seek to the segment start time', () => {
      playSegment$.next({ hasSegmentBounds: { start: 10, end: 40 } });

      expect(mediaControlMock.playMedia).toHaveBeenCalledWith(10, 40);
    });
  });

  describe('when the media control requests playback at a valid position', () => {
    it('seeks to the requested time and starts playing', () => {
      component.duration = 300;

      play$.next(100);

      expect(mediaPlayerMock.navigate).toHaveBeenCalledWith(100);
      expect(mediaPlayerMock.play).toHaveBeenCalled();
    });
  });

  describe('when the media control requests playback past the end of the file', () => {
    it('shows a notification instead of seeking', () => {
      component.duration = 60;

      play$.next(90);

      expect(notificationMock.openSnackBar).toHaveBeenCalled();
      expect(mediaPlayerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('when the video fails to play (MediaError)', () => {
    // Use numeric constants directly — MediaError is not available in jsdom
    const MEDIA_ERR_ABORTED = 1;
    const MEDIA_ERR_NETWORK = 2;
    const MEDIA_ERR_DECODE = 3;
    const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

    it('stores a human-readable error message for display', () => {
      const event = {
        target: {
          error: { code: MEDIA_ERR_NETWORK },
        },
      } as unknown as ErrorEvent;

      component.handleVideoError(event);

      expect(component.videoError).toBeTruthy();
    });

    it('handles each known MediaError code without throwing', () => {
      const codes = [MEDIA_ERR_ABORTED, MEDIA_ERR_NETWORK, MEDIA_ERR_DECODE, MEDIA_ERR_SRC_NOT_SUPPORTED];

      for (const code of codes) {
        const event = { target: { error: { code } } } as unknown as ErrorEvent;
        expect(() => component.handleVideoError(event)).not.toThrow();
      }
    });
  });

  describe('ngOnDestroy', () => {
    it('completes without error', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
