import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map, Observable } from 'rxjs';
import { Operator } from '../operators.config';
import { SearchFlowLogger } from './search-flow-logger.service';

export interface SearchUrlParams {
  q?: string;
  ontology?: string;
  class?: string;
  filters?: string;
  orderBy?: string;
}

export interface FilterParam {
  parentIndex: number | null;
  predicateIri: string;
  operator: Operator;
  value: string;
}

@Injectable()
export class SearchUrlSyncService {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _logger = inject(SearchFlowLogger);

  /**
   * Continuous decoded query-param stream — the read side of "URL is the source of truth".
   * Emits on every navigation (initial, user action, back/forward), deduped on the decoded shape so
   * identical params do not re-trigger downstream work. Fires immediately with the current params on
   * subscribe (Router's `queryParams` replays the latest value).
   */
  readonly params$: Observable<SearchUrlParams> = this._route.queryParams.pipe(
    map(p => this._mapParams(p)),
    distinctUntilChanged(
      (a, b) =>
        a.q === b.q &&
        a.ontology === b.ontology &&
        a.class === b.class &&
        a.filters === b.filters &&
        a.orderBy === b.orderBy
    )
  );

  readParams(): SearchUrlParams {
    const params = this._mapParams(this._route.snapshot.queryParams);
    this._logger.urlRead(params);
    return params;
  }

  // Every current caller passes `replaceUrl: false` to push a new history entry so browser back/forward
  // steps through each action — including debounced fulltext, where each pause is one entry (the debounce
  // itself coalesces the keystroke burst). Pass `replaceUrl: true` for a change that should overwrite the
  // current entry instead of adding one.
  writeState(state: SearchUrlParams, { replaceUrl = true }: { replaceUrl?: boolean } = {}): void {
    this._logger.urlWrite(state);
    this._router.navigate([], {
      queryParams: this._toQueryParams(state),
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }

  clearAll(): void {
    this._logger.urlClear();
    // Route through the single write API. Under `merge`, nulling every known param
    // removes it — equivalent to clearing. `replaceUrl: true` keeps reset out of history.
    this.writeState({ q: undefined, ontology: undefined, class: undefined, filters: undefined, orderBy: undefined });
  }

  encodeFilters(
    statements: { predicateIri: string; operator: Operator; value: string; parentIndex?: number }[]
  ): string {
    return encodeURIComponent(JSON.stringify(statements));
  }

  decodeFilters(raw: string): FilterParam[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      return (parsed as { predicateIri: string; operator: Operator; value: string; parentIndex?: number }[]).map(s => ({
        ...s,
        parentIndex: s.parentIndex ?? null,
      }));
    } catch {
      return [];
    }
  }

  private _mapParams(p: Record<string, string>): SearchUrlParams {
    return {
      q: p['q'] || undefined,
      ontology: p['ontology'] || undefined,
      class: p['class'] || undefined,
      filters: p['filters'] || undefined,
      orderBy: p['orderBy'] || undefined,
    };
  }

  private _toQueryParams(state: SearchUrlParams): Record<string, string | null> {
    const params: Record<string, string | null> = {};
    if ('q' in state) params['q'] = state.q || null;
    if ('ontology' in state) params['ontology'] = state.ontology || null;
    if ('class' in state) params['class'] = state.class || null;
    if ('filters' in state) params['filters'] = state.filters || null;
    if ('orderBy' in state) params['orderBy'] = state.orderBy || null;
    return params;
  }
}
