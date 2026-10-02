import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ResourceResultService {
  private _pageIndexSubject = new BehaviorSubject(0);
  pageIndex$ = this._pageIndexSubject.asObservable();

  private readonly _numberOfResults = signal<number | null>(0);

  /**
   * Total number of results across all pages, or `null` when the count query failed and the total is
   * genuinely unknown. Nullable rather than "0" or the current page's length on purpose: consumers
   * present this figure to the user, and substituting a wrong total is worse than admitting an
   * unknown one (DEV-6866).
   *
   * Signal-backed behind a plain property so existing call sites read and assign it unchanged. The
   * backing matters now that the count is rendered by a component the writer no longer owns: with a
   * single shared instance, the result header sits outside the writing component's change-detection
   * path, and a plain field would leave a stale total on screen until something unrelated ticked.
   */
  get numberOfResults(): number | null {
    return this._numberOfResults();
  }

  set numberOfResults(value: number | null) {
    this._numberOfResults.set(value);
  }
  readonly MAX_RESULTS_PER_PAGE = 25;

  updatePageIndex(newIndex: number): void {
    this._pageIndexSubject.next(newIndex);
  }
}
