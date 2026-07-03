import { Injectable } from '@angular/core';
import { SearchUrlParams } from './search-url-sync.service';

const TAG = '[SearchFlow]';
const c = {
  stage: 'color: #7c3aed; font-weight: bold',
  data: 'color: #0369a1',
  warn: 'color: #b45309',
};

/**
 * Dev-time trace of the single URL-driven search pipeline (DEV-6576). Trimmed in Phase 5 to just the
 * events that still exist after the flip: URL reads/writes, user interactions, and the results API.
 * The old per-concern restore/query logging (`_applyParams`, `_emitSearch`, popstate, orderBy
 * write-back, …) went away with the imperative path it described.
 */
@Injectable()
export class SearchFlowLogger {
  // ── URL sync ─────────────────────────────────────────────────────────────

  urlRead(params: SearchUrlParams): void {
    console.log(`%c${TAG} URL read`, c.stage, params);
  }

  urlWrite(state: SearchUrlParams): void {
    console.log(`%c${TAG} URL write`, c.data, state);
  }

  urlClear(): void {
    console.log(`%c${TAG} URL cleared`, c.warn);
  }

  // ── User interactions ─────────────────────────────────────────────────────

  fulltextChanged(q: string): void {
    console.log(`%c${TAG} Fulltext changed`, c.data, JSON.stringify(q));
  }

  filterConfirmed(chipId: string): void {
    console.log(`%c${TAG} Filter confirmed`, c.data, chipId);
  }

  filterRemoved(chipId: string): void {
    console.log(`%c${TAG} Filter removed`, c.data, chipId);
  }

  // ── Results ───────────────────────────────────────────────────────────────

  searchStart(page: number): void {
    console.log(`%c${TAG} API search start`, c.data, `page=${page}`);
  }

  searchSuccess(count: number, total: number): void {
    console.log(`%c${TAG} API search success`, c.data, `${count} resources, total=${total}`);
  }

  searchError(err: unknown): void {
    console.warn(`%c${TAG} API search error`, c.warn, err);
  }
}
