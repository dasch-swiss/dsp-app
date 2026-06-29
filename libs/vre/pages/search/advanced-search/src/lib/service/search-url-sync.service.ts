import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs';
import { Operator } from '../operators.config';

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

  // Fires only on browser back/forward — the only time full state restore is needed.
  readonly popstate$ = this._router.events.pipe(
    filter((e): e is NavigationStart => e instanceof NavigationStart && e.navigationTrigger === 'popstate'),
    switchMap(() => this._route.queryParams.pipe(take(1))),
    map(p => this._mapParams(p))
  );

  readParams(): SearchUrlParams {
    return this._mapParams(this._route.snapshot.queryParams);
  }

  writeState(state: SearchUrlParams): void {
    this._router.navigate([], {
      queryParams: this._toQueryParams(state),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  clearAll(): void {
    this._router.navigate([], {
      queryParams: { q: null, ontology: null, class: null, filters: null, orderBy: null },
    });
  }

  encodeFilters(
    statements: { predicateIri: string; operator: Operator; value: string; parentIndex?: number }[]
  ): string {
    return statements
      .map(s => {
        const prefix = s.parentIndex !== undefined ? `${s.parentIndex}:` : '';
        return `${prefix}${s.predicateIri}|${s.operator}|${encodeURIComponent(s.value ?? '')}`;
      })
      .join(',');
  }

  decodeFilters(raw: string): FilterParam[] {
    if (!raw) return [];
    return raw.split(',').map(segment => {
      const parentMatch = segment.match(/^(\d+):/);
      const body = parentMatch ? segment.slice(parentMatch[0].length) : segment;
      const pipeIndex1 = body.indexOf('|');
      const pipeIndex2 = body.indexOf('|', pipeIndex1 + 1);
      const predicateIri = body.slice(0, pipeIndex1);
      const operator = body.slice(pipeIndex1 + 1, pipeIndex2) as Operator;
      const value = decodeURIComponent(body.slice(pipeIndex2 + 1));
      return {
        parentIndex: parentMatch ? +parentMatch[1] : null,
        predicateIri,
        operator,
        value,
      };
    });
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
