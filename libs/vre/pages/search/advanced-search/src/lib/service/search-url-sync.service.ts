import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map, Observable } from 'rxjs';
import { decodeFilters, encodeFilters, FilterParam, FilterParamInput } from '../filter-params.codec';
import { OrderDirection } from '../model';
import { SearchFlowLogger } from './search-flow-logger.service';

export interface SearchUrlParams {
  q?: string;
  ontology?: string;
  class?: string;
  filters?: string;
  orderBy?: string;
  /** Sort direction for `orderBy`. Meaningless on its own — only ever set when `orderBy` is present. */
  orderDir?: OrderDirection;
}

// The filter wire format is shared across every page that hosts the chip bar, so it lives in the codec
// rather than here. Re-exported because this service is still the import site for most callers.
export type { FilterParam } from '../filter-params.codec';

/**
 * Each URL parameter name must be spelled identically to its `SearchUrlParams` key.
 *
 * A looser `Record<keyof SearchUrlParams, string>` only proves every key *has* a name — it never
 * checks that the name matches, so `class: 'clss'` would compile and silently change the URL
 * contract. Pinning each value type to the key itself makes any drift a compile error right at the
 * `ADVANCED_SEARCH_PARAM` declaration.
 *
 * The trade-off is deliberate: renaming a URL parameter now requires renaming the interface field
 * too. That is the point — the rename fails loudly in one place instead of silently somewhere else.
 */
type AdvancedSearchParamNames = { [K in keyof Required<SearchUrlParams>]: K };

/**
 * The advanced-search URL contract: the query-parameter names that carry the page's durable state.
 * A saved or shared search link is user-facing, so renaming a member here changes that contract.
 *
 * This service is the only thing that should know the URL shape, so the names live here rather than in
 * the app-wide `RouteConstants` (DEV-7252 — an unused duplicate set there used to make renames look
 * effective while the live values stayed put).
 */
export const ADVANCED_SEARCH_PARAM = {
  q: 'q',
  ontology: 'ontology',
  class: 'class',
  filters: 'filters',
  orderBy: 'orderBy',
  orderDir: 'orderDir',
} as const satisfies AdvancedSearchParamNames;

/**
 * Copies one supplied field of `state` onto `params` under its URL parameter name.
 *
 * The single `key` drives all three things a write needs — the presence test, the URL name via
 * `ADVANCED_SEARCH_PARAM`, and the value read — so they cannot be mispaired. Spelling the name three
 * times per line instead (`if ('q' in state) params[ADVANCED_SEARCH_PARAM.ontology] = state.class`)
 * compiles clean and silently writes the wrong parameter; `satisfies` only guarantees the two shapes
 * stay parallel, not that a given line pairs the matching members.
 *
 * Presence, not truthiness: an explicitly-supplied `undefined` writes `null`, which under the
 * router's `merge` handling removes the parameter. A field the caller omitted is left untouched.
 *
 * `encode` defaults to "non-empty string, else null"; pass one for a field needing other treatment.
 */
function copyParam<K extends keyof SearchUrlParams>(
  state: SearchUrlParams,
  params: Record<string, string | null>,
  key: K,
  encode: (value: SearchUrlParams[K]) => string | null = value => (value as string | undefined) || null
): void {
  if (key in state) params[ADVANCED_SEARCH_PARAM[key]] = encode(state[key]);
}

/** The only `orderDir` value ever written to the URL; `asc` is the default and stays out of it. */
const ORDER_DIR_DESC: OrderDirection = 'desc';

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
        a.orderBy === b.orderBy &&
        a.orderDir === b.orderDir
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
    this.writeState({
      q: undefined,
      ontology: undefined,
      class: undefined,
      filters: undefined,
      orderBy: undefined,
      orderDir: undefined,
    });
  }

  // Thin delegations to the shared codec. Kept as instance methods so the many existing call sites that
  // reach them through this service keep compiling; the encoding itself is page-agnostic.
  encodeFilters(statements: FilterParamInput[]): string {
    return encodeFilters(statements);
  }

  decodeFilters(raw: string): FilterParam[] {
    return decodeFilters(raw);
  }

  private _mapParams(p: Record<string, string>): SearchUrlParams {
    const orderBy = p[ADVANCED_SEARCH_PARAM.orderBy] || undefined;
    return {
      q: p[ADVANCED_SEARCH_PARAM.q] || undefined,
      ontology: p[ADVANCED_SEARCH_PARAM.ontology] || undefined,
      class: p[ADVANCED_SEARCH_PARAM.class] || undefined,
      filters: p[ADVANCED_SEARCH_PARAM.filters] || undefined,
      orderBy,
      // `orderDir` is meaningful only alongside `orderBy`, and only `desc` changes behaviour (ASC is the
      // default). Drop an orphan direction and normalise anything but the literal `desc` to undefined, so
      // hand-edited / stale URLs can never produce a half-set sort state.
      orderDir: orderBy && p[ADVANCED_SEARCH_PARAM.orderDir] === ORDER_DIR_DESC ? ORDER_DIR_DESC : undefined,
    };
  }

  private _toQueryParams(state: SearchUrlParams): Record<string, string | null> {
    const params: Record<string, string | null> = {};
    // The argument is a `SearchUrlParams` key; `copyParam` resolves it to the URL name through
    // `ADVANCED_SEARCH_PARAM`. `AdvancedSearchParamNames` keeps the two spellings locked, so any
    // drift is a compile error at the declaration rather than a silently-wrong parameter here.
    copyParam(state, params, 'q');
    copyParam(state, params, 'ontology');
    copyParam(state, params, 'class');
    copyParam(state, params, 'filters');
    copyParam(state, params, 'orderBy');
    // Only `desc` is ever written; `asc` is the default and stays out of the URL to keep it clean.
    copyParam(state, params, 'orderDir', dir => (dir === ORDER_DIR_DESC ? ORDER_DIR_DESC : null));
    return params;
  }
}
