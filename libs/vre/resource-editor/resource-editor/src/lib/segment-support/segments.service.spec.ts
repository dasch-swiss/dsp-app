import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Segment } from './segment';
import { SegmentApiService } from './segment-api.service';
import { SegmentsService } from './segments.service';

const makeSegments = (count: number): Segment[] =>
  Array.from({ length: count }, (_, i) => ({ label: `seg${i}` }) as unknown as Segment);

describe('SegmentsService', () => {
  let service: SegmentsService;
  let segmentApiMock: jest.Mocked<Pick<SegmentApiService, 'getSegment'>>;
  let cdrMock: jest.Mocked<Pick<ChangeDetectorRef, 'detectChanges'>>;

  beforeEach(() => {
    segmentApiMock = { getSegment: jest.fn() };
    cdrMock = { detectChanges: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        SegmentsService,
        { provide: SegmentApiService, useValue: segmentApiMock },
        { provide: ChangeDetectorRef, useValue: cdrMock },
      ],
    });

    service = TestBed.inject(SegmentsService);
  });

  describe('getSegment', () => {
    it('stores segments and calls detectChanges when fewer than 25 results', () => {
      const segments = makeSegments(3);
      segmentApiMock.getSegment.mockReturnValue(of(segments));

      service.getSegment('http://example.org/resource', 'VideoSegment');

      expect(service.segments).toEqual(segments);
      expect(cdrMock.detectChanges).toHaveBeenCalled();
    });

    it('paginates when first page returns exactly 25 results', () => {
      const page0 = makeSegments(25);
      const page1 = makeSegments(5);
      segmentApiMock.getSegment
        .mockReturnValueOnce(of(page0))
        .mockReturnValueOnce(of(page1));

      service.getSegment('http://example.org/resource', 'AudioSegment');

      expect(segmentApiMock.getSegment).toHaveBeenCalledTimes(2);
      expect(segmentApiMock.getSegment).toHaveBeenNthCalledWith(1, 'AudioSegment', 'http://example.org/resource', 0);
      expect(segmentApiMock.getSegment).toHaveBeenNthCalledWith(2, 'AudioSegment', 'http://example.org/resource', 1);
      expect(service.segments).toHaveLength(30);
    });

    it('does not paginate when first page returns fewer than 25 results', () => {
      segmentApiMock.getSegment.mockReturnValue(of(makeSegments(10)));

      service.getSegment('http://example.org/resource', 'VideoSegment');

      expect(segmentApiMock.getSegment).toHaveBeenCalledTimes(1);
    });
  });

  describe('highlightSegment', () => {
    it('emits the segment on highlightSegment$', () => {
      const segment = { label: 'seg1' } as unknown as Segment;
      let emitted: Segment | null = null;
      service.highlightSegment$.subscribe(s => (emitted = s));

      service.highlightSegment(segment);

      expect(emitted).toBe(segment);
    });
  });

  describe('playSegment', () => {
    it('emits the segment on playSegment$', () => {
      const segment = { label: 'seg1' } as unknown as Segment;
      let emitted: Segment | null = null;
      service.playSegment$.subscribe(s => (emitted = s));

      service.playSegment(segment);

      expect(emitted).toBe(segment);
    });
  });
});
