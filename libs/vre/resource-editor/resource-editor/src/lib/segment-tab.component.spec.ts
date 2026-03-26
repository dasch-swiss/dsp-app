import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { BehaviorSubject } from 'rxjs';
import { Segment } from './segment-support/segment';
import { SegmentsService } from './segment-support/segments.service';
import { SegmentTabComponent } from './segment-tab.component';

describe('SegmentTabComponent', () => {
  let component: SegmentTabComponent;
  let fixture: ComponentFixture<SegmentTabComponent>;
  let highlightSegment$: BehaviorSubject<Segment | null>;
  let segmentsServiceMock: jest.Mocked<Pick<SegmentsService, 'segments' | 'highlightSegment$' | 'playSegment'>>;

  const makeSegment = (id: string) =>
    ({
      resource: { res: { id } },
      label: `Segment ${id}`,
    }) as unknown as Segment;

  beforeEach(async () => {
    highlightSegment$ = new BehaviorSubject<Segment | null>(null);
    segmentsServiceMock = {
      segments: [],
      highlightSegment$: highlightSegment$.asObservable(),
      playSegment: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SegmentTabComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: SegmentsService, useValue: segmentsServiceMock },
        { provide: ChangeDetectorRef, useValue: { detectChanges: jest.fn() } },
      ],
    })
      .overrideComponent(SegmentTabComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(SegmentTabComponent);
    component = fixture.componentInstance;
    component.resource = { id: 'http://r/parent' } as unknown as ReadResource;
    fixture.detectChanges(); // triggers ngOnInit
  });

  describe('highlightSegment$ subscription', () => {
    it('updates selectedSegment when service emits a segment', fakeAsync(() => {
      const segment = makeSegment('http://r/seg1');

      highlightSegment$.next(segment);
      tick(100); // account for delay(100) in ngOnInit

      expect(component.selectedSegment).toBe(segment);
    }));

    it('sets selectedSegment to null when service emits null', fakeAsync(() => {
      // First emit a segment, then emit null
      highlightSegment$.next(makeSegment('http://r/seg1'));
      tick(100);

      highlightSegment$.next(null);
      tick(100);

      expect(component.selectedSegment).toBeNull();
    }));
  });

  describe('onTargetClicked', () => {
    it('calls segmentsService.playSegment with the segment', () => {
      const segment = makeSegment('http://r/seg1');

      component.onTargetClicked(segment);

      expect(segmentsServiceMock.playSegment).toHaveBeenCalledWith(segment);
    });
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes without error', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
