import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadAudioFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, EMPTY, of, Subject } from 'rxjs';
import { MediaControlService } from '../../segment-support/media-control.service';
import { SegmentsService } from '../../segment-support/segments.service';
import { RepresentationService } from '../representation.service';
import { MediaPlayerService } from '../video/media-player.service';
import { AudioComponent } from './audio.component';

const makeSrc = (): ReadAudioFileValue =>
  ({ fileUrl: 'http://example.org/audio.mp3' }) as unknown as ReadAudioFileValue;

const makeParentResource = (id = 'http://r/resource'): ReadResource =>
  ({ id, properties: {} }) as unknown as ReadResource;

describe('AudioComponent — behavior', () => {
  let component: AudioComponent;
  let fixture: ComponentFixture<AudioComponent>;
  let segmentsServiceMock: jest.Mocked<Pick<SegmentsService, 'onInit' | 'playSegment$'>>;
  let mediaControlMock: jest.Mocked<Pick<MediaControlService, 'playMedia' | 'play$' | 'watchForPause$'>>;
  let mediaPlayerMock: jest.Mocked<Pick<MediaPlayerService, 'navigate' | 'play' | 'pause' | 'duration' | 'navigateToStart' | 'onTimeUpdate$'>>;
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
    };
    mediaPlayerMock = {
      navigate: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      duration: jest.fn().mockReturnValue(120),
      navigateToStart: jest.fn(),
      onTimeUpdate$: new BehaviorSubject(0).asObservable(),
    };
    representationServiceMock = {
      getFileInfo: jest.fn().mockReturnValue(of({ originalFilename: 'audio-file.mp3' })),
    };
    notificationMock = { openSnackBar: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [AudioComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService()],
    })
      .overrideComponent(AudioComponent, {
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

    fixture = TestBed.createComponent(AudioComponent);
    component = fixture.componentInstance;
    component.src = makeSrc();
    component.parentResource = makeParentResource();
    component.ngOnChanges({
      src: new SimpleChange(null, component.src, true),
      parentResource: new SimpleChange(null, component.parentResource, true),
    });
    fixture.detectChanges();
  });

  describe('when the audio file loads', () => {
    it('loads segments for the parent resource', () => {
      expect(segmentsServiceMock.onInit).toHaveBeenCalledWith('http://r/resource', 'AudioSegment');
    });

    it('fetches the original filename for display', () => {
      expect(component.originalFilename).toBe('audio-file.mp3');
    });
  });

  describe('when the file fails to load', () => {
    it('shows an error state', () => {
      representationServiceMock.getFileInfo.mockReturnValue(EMPTY);

      // Simulate native audio element error event
      const errorEvent = { target: { error: { code: 2, message: 'Network error' } } } as unknown as Event;
      component.onAudioError(errorEvent);

      expect(component.failedToLoad).toBe(true);
    });
  });

  describe('when a segment is selected for playback', () => {
    it('requests the media player to seek to the segment start time', () => {
      playSegment$.next({ hasSegmentBounds: { start: 30, end: 60 } });

      expect(mediaControlMock.playMedia).toHaveBeenCalledWith(30, 60);
    });
  });

  describe('when the media control requests playback at a valid position', () => {
    it('seeks to the requested time and starts playing', () => {
      component.duration = 120;

      play$.next(45);

      expect(mediaPlayerMock.navigate).toHaveBeenCalledWith(45);
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

  describe('ngOnDestroy', () => {
    it('completes without error', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
