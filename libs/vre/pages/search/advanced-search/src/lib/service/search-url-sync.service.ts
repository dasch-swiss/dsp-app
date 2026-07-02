import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
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

  // Fires only on browser back/forward — after navigation commits so queryParams are already updated.
  readonly popstate$ = this._router.events.pipe(
    filter(
      (e): e is NavigationEnd =>
        e instanceof NavigationEnd && this._router.lastSuccessfulNavigation()?.trigger === 'popstate'
    ),
    map(() => {
      const params = this._mapParams(this._route.snapshot.queryParams);
      this._logger.popstate(params);
      return params;
    })
  );

  readParams(): SearchUrlParams {
    const params = this._mapParams(this._route.snapshot.queryParams);
    this._logger.urlRead(params);
    return params;
  }

  // `replaceUrl` defaults to true so continuous changes (e.g. debounced fulltext typing) overwrite the
  // current history entry. Discrete user actions (confirming/removing a filter, changing class or ontology)
  // pass `replaceUrl: false` to push a new entry so browser back/forward steps through them.
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
    // Route through the single write API (DEV-6576 D5). Under `merge`, nulling every known param
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
