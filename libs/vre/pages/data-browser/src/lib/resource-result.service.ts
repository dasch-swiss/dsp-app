import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ResourceResultService {
  private _pageIndexSubject = new BehaviorSubject(0);
  pageIndex$ = this._pageIndexSubject.asObservable();

  numberOfResults = 0;
  readonly MAX_RESULTS_PER_PAGE = 25;

  updatePageIndex(newIndex: number): void {
    this._pageIndexSubject.next(newIndex);
  }
}
