import { ChangeDetectorRef, Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, expand, reduce } from 'rxjs';
import { Segment } from './segment';
import { SegmentApiService } from './segment-api.service';

@Injectable()
export class SegmentsService {
  segments: Segment[] = [];

  private _highlightSegment = new BehaviorSubject<Segment | null>(null);
  highlightSegment$ = this._highlightSegment.asObservable();

  constructor(
    private _segmentApi: SegmentApiService,
    private _cdr: ChangeDetectorRef
  ) {}

  onInit(resourceIri: string, type: 'VideoSegment' | 'AudioSegment') {
    this.getSegment(resourceIri, type);
  }

  getSegment(resourceIri: string, type: 'VideoSegment' | 'AudioSegment') {
    let page = 0;
    this._segmentApi
      .getSegment(type, resourceIri, page)
      .pipe(
        expand(v => {
          if (v.length >= 25) {
            page += 1;
            return this._segmentApi.getSegment(type, resourceIri, page);
          } else {
            return EMPTY;
          }
        }),
        reduce((acc, value) => [...acc, ...value], [] as Segment[])
      )
      .subscribe(v => {
        this.segments = v;
        this._cdr.detectChanges();
      });
  }

  highlightSegment(segment: Segment) {
    this._highlightSegment.next(segment);
  }
}
