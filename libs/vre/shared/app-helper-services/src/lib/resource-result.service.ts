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

  /**
   * True while a page of results is being fetched to replace the one on screen — after a filter,
   * sort, search or page change. Not set for a view's first load, which has nothing on screen to
   * keep and shows its own spinner instead.
   *
   * Here rather than on the fetching components so the class header, which sits above both views,
   * can show the one wait for either: it holds the count and pager that are about to change.
   */
  readonly isRefreshing = signal(false);

  private _hasResults = false;

  /** A view is (re)starting from nothing: its first load is not a refresh. */
  resetLoading(): void {
    this._hasResults = false;
    this.isRefreshing.set(false);
  }

  /** A fetch has started. A refresh only once some results are on screen. */
  markLoading(): void {
    if (this._hasResults) {
      this.isRefreshing.set(true);
    }
  }

  /** Results are on screen. */
  markLoaded(): void {
    this._hasResults = true;
    this.isRefreshing.set(false);
  }

  /** The fetch failed; the failure panel replaces the results, so there is nothing to wait on. */
  markFailed(): void {
    this.isRefreshing.set(false);
  }

  updatePageIndex(newIndex: number): void {
    this._pageIndexSubject.next(newIndex);
  }
}
