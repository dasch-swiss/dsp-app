import { Injectable } from '@angular/core';
import { SearchUrlParams } from './search-url-sync.service';

const TAG = '[SearchFlow]';
const c = {
  stage: 'color: #7c3aed; font-weight: bold',
  data: 'color: #0369a1',
  warn: 'color: #b45309',
  query: 'color: #166534; font-family: monospace',
};

@Injectable()
export class SearchFlowLogger {
  // ── URL sync ─────────────────────────────────────────────────────────────

  urlRead(params: SearchUrlParams): void {
    console.log(`%c${TAG} URL read on init`, c.stage, params);
  }

  urlWrite(state: SearchUrlParams): void {
    console.log(`%c${TAG} URL write`, c.data, state);
  }

  urlClear(): void {
    console.log(`%c${TAG} URL cleared`, c.warn);
  }

  popstate(params: SearchUrlParams): void {
    console.log(`%c${TAG} popstate (back/forward)`, c.stage, params);
  }

  // ── State restores ────────────────────────────────────────────────────────

  ontologyReady(iri: string): void {
    console.log(`%c${TAG} Ontology ready → restoring from URL`, c.stage, iri);
  }

  applyParams(params: SearchUrlParams): void {
    console.log(`%c${TAG} _applyParams`, c.data, params);
  }

  filtersRestored(count: number): void {
    console.log(`%c${TAG} Filters restored from URL`, c.data, `${count} statement(s)`);
  }

  stateReset(): void {
    console.log(`%c${TAG} State reset`, c.warn);
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

  orderByChanged(orderById: string | undefined): void {
    console.log(`%c${TAG} Order by changed`, c.data, orderById ?? '(none)');
  }

  // ── Query generation ──────────────────────────────────────────────────────

  emitSearch(
    reason: 'fulltext' | 'filter-confirm' | 'filter-remove' | 'restore' | 'popstate' | 'resource-class' | 'order-by'
  ): void {
    console.log(`%c${TAG} _emitSearch triggered by: ${reason}`, c.stage);
  }

  queryGenerated(query: string): void {
    const short = query.length > 300 ? query.slice(0, 300) + '…' : query;
    console.log(`%c${TAG} GravSearch query generated`, c.query, '\n' + short);
  }

  queryNull(): void {
    console.log(`%c${TAG} Query set to null (no active filters)`, c.warn);
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
