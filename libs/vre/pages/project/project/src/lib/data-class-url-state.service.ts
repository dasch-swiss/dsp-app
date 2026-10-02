import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import {
  decodeFilters,
  encodeFilters,
  FilterParam,
  OrderByItem,
  RDFS_LABEL,
  SearchFilterState,
} from '@dasch-swiss/vre/pages/search/search-filters';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { combineLatest, distinctUntilChanged, map, Observable } from 'rxjs';
import { ProjectPageService } from './project-page.service';

/**
 * The Data tab's query parameters.
 *
 * Deliberately *not* advanced search's six. The ontology and resource class are route path
 * segments here — the sidenav fixes them — so writing them as query params would duplicate the route
 * and, worse, collide with it: the path params on this route are themselves named `ontology` and
 * `class`. The sort carries both a predicate and a direction, but label is the default on both
 * counts, so an unsorted view writes neither.
 */
export interface DataClassUrlParams {
  q?: string;
  filters?: string;
  /** Predicate IRI to sort by. Absent means `rdfs:label`, the default, so it stays out of the URL. */
  orderBy?: string;
  /** `desc` or absent. Meaningful on its own: with no `orderBy` the sort is label descending. */
  orderDir?: 'desc';
  /** `table` or absent. List is the default and stays out of the URL. */
  view?: 'table';
}

export const DATA_CLASS_PARAM = {
  q: 'q',
  filters: 'filters',
  orderBy: 'orderBy',
  orderDir: 'orderDir',
  view: 'view',
} as const satisfies { [K in keyof Required<DataClassUrlParams>]: K };

/** The only direction ever written; ascending is the default and stays out of the URL. */
const DESC = 'desc' as const;

/** How the result page is rendered. */
export type DataClassView = 'list' | 'table';

/** The only view ever written; list is the default and stays out of the URL. */
const TABLE = 'table' as const;

/**
 * Where the Data tab keeps its search state.
 *
 * This is the Data tab's half of the {@link SearchFilterState} contract — the chip bar is shared
 * verbatim with the Search tab, but how a filter is *stored* is each page's own business. Component
 * scoped, provided by the class view, so it never collides with advanced search's service.
 */
@Injectable()
export class DataClassUrlStateService implements SearchFilterState {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _ontologyService = inject(OntologyService);
  private readonly _projectPageService = inject(ProjectPageService);

  private readonly _params$: Observable<DataClassUrlParams> = this._route.queryParams.pipe(
    map(p => ({
      q: p[DATA_CLASS_PARAM.q] || undefined,
      filters: p[DATA_CLASS_PARAM.filters] || undefined,
      orderBy: p[DATA_CLASS_PARAM.orderBy] || undefined,
      // Anything but the literal `desc` normalises away, so a hand-edited URL cannot produce a
      // half-set sort.
      orderDir: p[DATA_CLASS_PARAM.orderDir] === DESC ? DESC : undefined,
      // Same normalisation, same reason: `?view=grid` falls back to the list rather than rendering
      // nothing at all.
      view: p[DATA_CLASS_PARAM.view] === TABLE ? TABLE : undefined,
    })),
    distinctUntilChanged(
      (a, b) =>
        a.q === b.q &&
        a.filters === b.filters &&
        a.orderBy === b.orderBy &&
        a.orderDir === b.orderDir &&
        a.view === b.view
    )
  );

  /** The route path segments that fix what is being browsed. */
  private readonly _routeScope$ = this._route.params.pipe(
    map(p => ({
      ontologyLabel: p[RouteConstants.ontologyParameter] as string | undefined,
      classLabel: p[RouteConstants.classParameter] as string | undefined,
    })),
    distinctUntilChanged((a, b) => a.ontologyLabel === b.ontologyLabel && a.classLabel === b.classLabel)
  );

  // ── SearchFilterState port ────────────────────────────────────────────────

  readonly filters$: Observable<FilterParam[]> = this._params$.pipe(
    map(p => (p.filters ? decodeFilters(p.filters) : [])),
    distinctUntilChanged((a, b) => a.length === b.length && a.every((f, i) => f === b[i]))
  );

  readonly fulltextTerm$: Observable<string> = this._params$.pipe(
    map(p => p.q ?? ''),
    distinctUntilChanged()
  );

  /**
   * Both IRIs need the project shortcode, which is only known once the project has loaded — and the
   * route params emit before that. Gating on `currentProject$` rather than reading
   * `ProjectPageService.currentProject` (which throws before `setup()`) is what keeps a first paint
   * from exploding.
   */
  private readonly _scope$ = combineLatest([this._routeScope$, this._projectPageService.currentProject$]).pipe(
    map(([{ ontologyLabel, classLabel }, project]) => ({ ontologyLabel, classLabel, shortcode: project.shortcode }))
  );

  readonly ontologyIri$: Observable<string | undefined> = this._scope$.pipe(
    map(({ ontologyLabel, shortcode }) =>
      ontologyLabel ? this._ontologyService.getOntologyIriFromRoute(shortcode, ontologyLabel) : undefined
    ),
    distinctUntilChanged()
  );

  readonly resourceClassIri$: Observable<string | undefined> = this._scope$.pipe(
    map(({ ontologyLabel, classLabel, shortcode }) =>
      ontologyLabel && classLabel
        ? this._ontologyService.getClassIdFromParams(shortcode, ontologyLabel, classLabel)
        : undefined
    ),
    distinctUntilChanged()
  );

  /**
   * A non-default sort counts as active state here, unlike on the Search tab. There, a direction
   * without an `orderBy` is meaningless and is dropped on read; here label is the implied default, so
   * `orderDir` alone is a real, resettable choice and must reveal the Reset control (REQ-1.10).
   *
   * `view` is deliberately absent. It narrows nothing — it only changes how the same results are
   * drawn — so counting it would leave the Reset control permanently lit in table view and imply
   * that Reset would switch the user back to the list (DEV-7466 REQ-1.14).
   */
  readonly hasActiveState$: Observable<boolean> = this._params$.pipe(
    map(p => !!(p.q || p.filters || p.orderBy || p.orderDir)),
    distinctUntilChanged()
  );

  /** List unless the URL says otherwise. */
  readonly view$: Observable<DataClassView> = this._params$.pipe(
    map(p => (p.view === TABLE ? TABLE : 'list')),
    distinctUntilChanged()
  );

  /** Ascending unless the URL says otherwise. */
  readonly sortDescending$: Observable<boolean> = this._params$.pipe(
    map(p => p.orderDir === DESC),
    distinctUntilChanged()
  );

  /** The predicate being sorted by. Absent from the URL means the default, `rdfs:label`. */
  readonly sortPredicateIri$: Observable<string> = this._params$.pipe(
    map(p => p.orderBy || RDFS_LABEL),
    distinctUntilChanged()
  );

  /**
   * The sort in the shape `GravsearchService` consumes.
   *
   * `_getOrderByString` keeps only items with `orderBy: true`. `rdfs:label` routes to the assembly's
   * shared `?label` variable; any other predicate gets a variable bound for it on demand, which is
   * what makes sorting by a property nobody filtered on possible at all.
   *
   * Labels stay empty — the picker renders its own text from the ontology, not from this item.
   *
   * The ascending label item is emitted rather than omitted. An empty array would produce the same
   * `ORDER BY ASC(?label)` by falling through to the service's default, but saying it outright keeps
   * the query a function of the URL instead of of a default two layers away.
   */
  readonly orderByItems$: Observable<OrderByItem[]> = combineLatest([
    this.sortPredicateIri$,
    this.sortDescending$,
  ]).pipe(map(([iri, descending]) => [new OrderByItem(iri, [], false, true, descending ? 'desc' : 'asc')]));

  setFulltextTerm(term: string | undefined): void {
    // Replace rather than push: the bar debounces at 300 ms, so pushing would turn one typed term
    // into several history entries and make Back step through fragments of a word.
    this._write({ q: term || undefined }, { replaceUrl: true });
  }

  /**
   * `removedPredicateIri` is ignored. The sort predicate is chosen from the class's properties, not
   * from the filters, so removing a filter cannot orphan it — the sort binds its own variable.
   */
  setFilters(filters: FilterParam[]): void {
    const encoded = filters.length
      ? encodeFilters(filters.map(f => ({ ...f, parentIndex: f.parentIndex ?? undefined })))
      : undefined;
    this._write({ filters: encoded }, { replaceUrl: false });
  }

  /**
   * Predicate and direction in one navigation. Two synchronous `navigate` calls get coalesced by the
   * Router and the second discards the first, so changing the property and resetting the direction
   * have to arrive together or one of them is silently lost.
   *
   * `rdfs:label` is the default and writes no `orderBy`, keeping the common case out of the URL.
   */
  setSort(predicateIri: string, descending: boolean): void {
    this._write(
      {
        orderBy: predicateIri === RDFS_LABEL ? undefined : predicateIri,
        orderDir: descending ? DESC : undefined,
      },
      { replaceUrl: false }
    );
  }

  /**
   * Which view is showing is a choice about presentation, not about the query, so switching it is
   * pushed rather than replaced: Back should step between list and table the way the user expects
   * of a visible mode switch.
   */
  setView(view: DataClassView): void {
    this._write({ view: view === TABLE ? TABLE : undefined }, { replaceUrl: false });
  }

  /**
   * `view` is not named here, and `_write` only touches the keys it is given — so Reset clears the
   * query the user built without also throwing away the view they are reading it in (REQ-1.14).
   * The same omission is what carries the view across a class switch, which calls this (REQ-1.15).
   */
  reset(): void {
    this._write({ q: undefined, filters: undefined, orderBy: undefined, orderDir: undefined }, { replaceUrl: true });
  }

  // ── URL plumbing ──────────────────────────────────────────────────────────

  /**
   * One navigation per call. Two synchronous `navigate`s get coalesced by the Router and the second
   * discards the first, so anything that must change together has to arrive in the same `state`.
   *
   * Only the three params above are ever named, so `merge` leaves the rest of the URL alone — and an
   * explicitly-supplied `undefined` becomes `null`, which under `merge` removes the parameter.
   */
  private _write(state: DataClassUrlParams, { replaceUrl }: { replaceUrl: boolean }): void {
    const queryParams: Record<string, string | null> = {};
    (Object.keys(state) as (keyof DataClassUrlParams)[]).forEach(key => {
      queryParams[DATA_CLASS_PARAM[key]] = state[key] || null;
    });
    this._router.navigate([], { relativeTo: this._route, queryParams, queryParamsHandling: 'merge', replaceUrl });
  }
}
