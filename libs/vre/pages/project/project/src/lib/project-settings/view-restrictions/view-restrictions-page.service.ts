import { Injectable } from '@angular/core';
import {
  AdminAPIApiService,
  GroupBy,
  ItemType,
  PagedResponseRestrictedResource,
  ViewRestrictionsSummary,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  EMPTY,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
import { ProjectPageService } from '../../project-page.service';

/**
 * Summary matrix load state: `loading` while a filter change is being fetched, then either `summary`
 * or `failed` — the three states are mutually exclusive, so the UI never has to guess.
 */
export interface SummaryState {
  loading: boolean;
  summary?: ViewRestrictionsSummary;
  failed?: boolean;
}

/**
 * State for the read-only "View restrictions" page (design screen 1h).
 *
 * Holds the current group-by / item-type filters and exposes the per-audience `summaryState$` matrix.
 * Drill-down items for one group are fetched on demand via `loadItems(...)`.
 */
@Injectable()
export class ViewRestrictionsPageService {
  private readonly _project$ = this._projectPageService.currentProject$;

  readonly groupBy$ = new BehaviorSubject<GroupBy>(GroupBy.ResourceClass);
  readonly itemType$ = new BehaviorSubject<ItemType>(ItemType.All);

  /**
   * The summary matrix as a load state, recomputed whenever the project, group-by or item-type changes.
   * Emits `{ loading: true }` immediately on every change (so the UI can show a spinner), then the result.
   *
   * `catchError` sits on the *inner* request so a failed fetch resolves to `{ failed: true }` instead of
   * terminating the outer stream: the spinner stops, and changing a filter afterwards still retries.
   */
  readonly summaryState$: Observable<SummaryState> = combineLatest([
    this._project$,
    this.groupBy$,
    this.itemType$,
  ]).pipe(
    switchMap(([project, groupBy, itemType]) => {
      if (!project) {
        return EMPTY;
      }
      return this._adminApiService
        .getAdminProjectsIriProjectiriViewRestrictionsSummary(project.id, groupBy, itemType)
        .pipe(
          map(summary => ({ loading: false, summary }) as SummaryState),
          catchError(() => of({ loading: false, failed: true } as SummaryState)),
          startWith({ loading: true } as SummaryState)
        );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(
    private readonly _adminApiService: AdminAPIApiService,
    private readonly _projectPageService: ProjectPageService
  ) {}

  setGroupBy(groupBy: GroupBy): void {
    this.groupBy$.next(groupBy);
  }

  setItemType(itemType: ItemType): void {
    this.itemType$.next(itemType);
  }

  /** Fetch the paginated affected resources/items under one group (class or property IRI). */
  loadItems(group: string, page: number, pageSize: number): Observable<PagedResponseRestrictedResource> {
    return this._project$.pipe(
      switchMap(project => {
        if (!project) {
          return EMPTY;
        }
        return this._adminApiService.getAdminProjectsIriProjectiriViewRestrictionsItems(
          project.id,
          group,
          this.groupBy$.value,
          this.itemType$.value,
          page,
          pageSize
        );
      })
    );
  }
}
