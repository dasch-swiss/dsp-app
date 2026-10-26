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
   * Signal-backed so a reader outside the writer's change-detection path still updates.
   */
  get numberOfResults(): number | null {
    return this._numberOfResults();
  }

  set numberOfResults(value: number | null) {
    this._numberOfResults.set(value);
  }
  readonly MAX_RESULTS_PER_PAGE = 25;

  /** True while a page of results is being fetched to replace the one on screen; not set for a view's first load. */
  readonly isRefreshing = signal(false);

  private _hasResults = false;

  resetLoading(): void {
    this._hasResults = false;
    this.isRefreshing.set(false);
  }

  markLoading(): void {
    if (this._hasResults) {
      this.isRefreshing.set(true);
    }
  }

  markLoaded(): void {
    this._hasResults = true;
    this.isRefreshing.set(false);
  }

  markFailed(): void {
    this.isRefreshing.set(false);
  }

  updatePageIndex(newIndex: number): void {
    this._pageIndexSubject.next(newIndex);
  }
}
