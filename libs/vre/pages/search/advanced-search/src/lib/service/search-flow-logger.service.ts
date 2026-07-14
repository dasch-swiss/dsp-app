import { Injectable, isDevMode } from '@angular/core';
import { SearchUrlParams } from './search-url-sync.service';

const TAG = '[SearchFlow]';
const c = {
  stage: 'color: #7c3aed; font-weight: bold',
  data: 'color: #0369a1',
  warn: 'color: #b45309',
};

/**
 * Dev-time trace of the URL-driven search pipeline: URL reads/writes, user interactions, and the
 * results API. Useful for following how a user action flows through the URL to the query and back.
 * All output is gated behind `isDevMode()`, so nothing is logged in production builds.
 */
@Injectable()
export class SearchFlowLogger {
  // ── URL sync ─────────────────────────────────────────────────────────────

  urlRead(params: SearchUrlParams): void {
    this._log('URL read', c.stage, params);
  }

  urlWrite(state: SearchUrlParams): void {
    this._log('URL write', c.data, state);
  }

  urlClear(): void {
    this._log('URL cleared', c.warn);
  }

  // ── User interactions ─────────────────────────────────────────────────────

  fulltextChanged(q: string): void {
    this._log('Fulltext changed', c.data, JSON.stringify(q));
  }

  filterConfirmed(chipId: string): void {
    this._log('Filter confirmed', c.data, chipId);
  }

  filterRemoved(chipId: string): void {
    this._log('Filter removed', c.data, chipId);
  }

  // ── Results ───────────────────────────────────────────────────────────────

  searchStart(page: number): void {
    this._log('API search start', c.data, `page=${page}`);
  }

  searchSuccess(count: number, total: number): void {
    this._log('API search success', c.data, `${count} resources, total=${total}`);
  }

  searchError(err: unknown): void {
    if (!isDevMode()) return;
    console.warn(`%c${TAG} API search error`, c.warn, err);
  }

  private _log(label: string, style: string, ...args: unknown[]): void {
    if (!isDevMode()) return;
    console.log(`%c${TAG} ${label}`, style, ...args);
  }
}
