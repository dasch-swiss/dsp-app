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
 * The Data tab's query parameters. Ontology and class are route path segments here, so they must
 * not also be query params (the names would collide).
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

/** The Data tab's {@link SearchFilterState}, stored in the URL. Component scoped, provided by the class view. */
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
      // Anything but the literal values normalises away, so a hand-edited URL cannot half-set them.
      orderDir: p[DATA_CLASS_PARAM.orderDir] === DESC ? DESC : undefined,
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

  /** Gated on `currentProject$`: `ProjectPageService.currentProject` throws before `setup()`. */
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
   * `orderDir` alone counts (label is the implied default sort). `view` must stay out: it narrows
   * nothing, and Reset must not light up for it.
   */
  readonly hasActiveState$: Observable<boolean> = this._params$.pipe(
    map(p => !!(p.q || p.filters || p.orderBy || p.orderDir)),
    distinctUntilChanged()
  );

  /** List unless the URL says otherwise. */
  readonly view$: Observable<DataClassView> = this._params$.pipe(
    // Return type annotated: the app build widens the ternary to `string`.
    map((p): DataClassView => (p.view === TABLE ? TABLE : 'list')),
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
   * The sort in the shape `GravsearchService` consumes, which keeps only items with `orderBy: true`.
   * The default label sort is emitted explicitly so the query is a function of the URL alone.
   */
  readonly orderByItems$: Observable<OrderByItem[]> = combineLatest([
    this.sortPredicateIri$,
    this.sortDescending$,
  ]).pipe(map(([iri, descending]) => [new OrderByItem(iri, [], false, true, descending ? 'desc' : 'asc')]));

  setFulltextTerm(term: string | undefined): void {
    // Replace, not push: Back must not step through fragments of a typed word.
    this._write({ q: term || undefined }, { replaceUrl: true });
  }

  /** `removedPredicateIri` is ignored: the sort binds its own variable, so removing a filter cannot orphan it. */
  setFilters(filters: FilterParam[]): void {
    const encoded = filters.length
      ? encodeFilters(filters.map(f => ({ ...f, parentIndex: f.parentIndex ?? undefined })))
      : undefined;
    this._write({ filters: encoded }, { replaceUrl: false });
  }

  /** Predicate and direction go in one navigation (see `_write`). `rdfs:label` writes no `orderBy`. */
  setSort(predicateIri: string, descending: boolean): void {
    this._write(
      {
        orderBy: predicateIri === RDFS_LABEL ? undefined : predicateIri,
        orderDir: descending ? DESC : undefined,
      },
      { replaceUrl: false }
    );
  }

  /** Pushed, not replaced, so Back steps between list and table. */
  setView(view: DataClassView): void {
    this._write({ view: view === TABLE ? TABLE : undefined }, { replaceUrl: false });
  }

  /** `view` is deliberately not cleared: Reset keeps the view, and a class switch calls this too. */
  reset(): void {
    this._write({ q: undefined, filters: undefined, orderBy: undefined, orderDir: undefined }, { replaceUrl: true });
  }

  // ── URL plumbing ──────────────────────────────────────────────────────────

  /**
   * One navigation per call. Two synchronous `navigate`s get coalesced by the Router and the second
   * discards the first, so anything that must change together has to arrive in the same `state`.
   *
   * Under `merge`, an explicitly-supplied `undefined` becomes `null`, which removes the parameter.
   */
  private _write(state: DataClassUrlParams, { replaceUrl }: { replaceUrl: boolean }): void {
    const queryParams: Record<string, string | null> = {};
    (Object.keys(state) as (keyof DataClassUrlParams)[]).forEach(key => {
      queryParams[DATA_CLASS_PARAM[key]] = state[key] || null;
    });
    this._router.navigate([], { relativeTo: this._route, queryParams, queryParamsHandling: 'merge', replaceUrl });
  }
}
