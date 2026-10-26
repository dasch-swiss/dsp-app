import { AsyncPipe } from '@angular/common';
import { Component, ErrorHandler, Inject, Input, OnChanges, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { KnoraApiConnection, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ErrorReportingService, userFacingReason } from '@dasch-swiss/vre/core/error-handler';
import { MultipleViewerService, ResourcesListComponent } from '@dasch-swiss/vre/pages/data-browser';
import { SearchFilterState } from '@dasch-swiss/vre/pages/search/search-filters';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { CenteredBoxComponent, CenteredMessageComponent, SearchFailedComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { BehaviorSubject, catchError, combineLatest, first, map, Observable, of, skip, switchMap, tap } from 'rxjs';
import { DataBrowserPageService } from '../../data-browser-page.service';
import { DataClassQueryService } from '../../data-class-query.service';
import { ProjectPageService } from '../../project-page.service';

@Component({
  selector: 'app-resources-list-fetcher',
  template: `
    @let data = data$ | async;
    @if (failed()) {
      <app-centered-box>
        <app-search-failed [reason]="failureReason()" (retry)="onRetry()" />
      </app-centered-box>
    } @else if (data) {
      @if (userCanViewResources) {
        @if (data.resources.length > 0) {
          <app-resources-list [resources]="data.resources" [showResultCount]="false" />
        } @else if (filtersAreActive) {
          <app-centered-message
            [message]="'pages.dataBrowser.resourcesListFetcher.noResourcesMatchFilters' | translate" />
        } @else {
          <app-centered-message [message]="'pages.dataBrowser.resourcesListFetcher.noResourcesFound' | translate" />
        }
      } @else {
        <div style="margin-top: 80px; align-items: center; text-align: center">
          <h3>{{ 'pages.dataBrowser.resourcesListFetcher.noPermissions' | translate }}</h3>
          <p>{{ 'pages.dataBrowser.resourcesListFetcher.checkPermissions' | translate }}</p>
        </div>
      }
    } @else {
      <app-progress-indicator />
    }
  `,
  // Do not provide `ResourceResultService` here: it would shadow the class view's instance that the header reads.
  imports: [
    AsyncPipe,
    TranslatePipe,
    ResourcesListComponent,
    CenteredBoxComponent,
    CenteredMessageComponent,
    AppProgressIndicatorComponent,
    SearchFailedComponent,
  ],
})
export class ResourcesListFetcherComponent implements OnChanges {
  @Input({ required: true }) ontologyLabel!: string;
  @Input({ required: true }) classLabel!: string;
  userCanViewResources = true;

  readonly failed = signal(false);
  /** dsp-api's own account of the failure, when it gave one fit to show. */
  readonly failureReason = signal<string | undefined>(undefined);

  /** Re-triggers the load after a failure. Replays on subscribe so the initial load runs too. */
  private readonly _retrySubject = new BehaviorSubject<void>(undefined);

  /** Mirrored into a field, not combined into the data stream: as a trigger it would fire a second request. */
  filtersAreActive = false;

  data$!: Observable<{ resources: ReadResource[]; selectFirstResource: boolean } | null>;

  constructor(
    @Inject(DspApiConnectionToken) private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _multipleViewerService: MultipleViewerService,
    private readonly _dataBrowserPageService: DataBrowserPageService,
    private readonly _resourceResult: ResourceResultService,
    private readonly _query: DataClassQueryService,
    private readonly _searchState: SearchFilterState,
    private readonly _errorHandler: ErrorHandler,
    private readonly _errorReporting: ErrorReportingService,
    protected route: ActivatedRoute,
    protected router: Router,
    public projectPageService: ProjectPageService
  ) {
    this._searchState.hasActiveState$.pipe(takeUntilDestroyed()).subscribe(active => (this.filtersAreActive = active));

    // `skip(1)` drops the BehaviorSubject's replayed value, which would run the initial load twice.
    this._dataBrowserPageService.onNavigationReload$
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this._retrySubject.next());
  }

  ngOnChanges() {
    this.failed.set(false);
    this.failureReason.set(undefined);

    this._resourceResult.resetLoading();
    this.data$ = this._retrySubject.pipe(switchMap(() => this._data$()));
  }

  onRetry() {
    // The retry subject is the outermost operator of `data$`, so re-entering it rebuilds the whole
    // chain. That matters: `catchError` completes the inner stream, so retrying from anywhere inside
    // it could never emit again.
    //
    // Nothing else is reset: a retry must repeat the failed request, not return to page 1.
    this.failed.set(false);
    this._resourceResult.resetLoading();
    this._retrySubject.next();
  }

  /**
   * The `catchError` is what keeps the spinner from spinning forever: with no error handling at all,
   * any failure left `data$` non-emitting, so the template's `@else` branch rendered the progress
   * indicator indefinitely — the same dead-end DEV-6866 fixed in the search components.
   */
  private _data$(): Observable<{ resources: ReadResource[]; selectFirstResource: boolean } | null> {
    const resources$ = this.projectPageService.currentProject$.pipe(
      first(),
      switchMap(project =>
        // `switchMap` over the query so a superseded response never lands.
        this._query.query$.pipe(
          switchMap((query, queryIndex) => {
            // Reset inside the projection, not in an upstream `tap`: the previous inner subscription is
            // already torn down, so no wasted request fires for the superseded query.
            if (queryIndex > 0) {
              this._resourceResult.updatePageIndex(0);
            }

            this._resourceResult.markLoading();
            return combineLatest([this._pagedResources$(query, project.id), this._countQuery$(query, project.id)]);
          })
        )
      ),
      map(([{ resources, pageIndex }, numberOfResults]) => this._applyCount(resources, pageIndex, numberOfResults)),
      tap(() => this._resourceResult.markLoaded())
    );

    return resources$.pipe(
      map(resources => this._applySelection(resources)),
      catchError((error: unknown) => {
        // Drop any previously known total: after a failed page change the old count describes results
        // that are no longer on screen, and leaving it would break the service's "null means genuinely
        // unknown" contract for as long as the failure state lasts.
        this._resourceResult.markFailed();
        this._resourceResult.numberOfResults = null;
        // A rejected request explains itself; the panel says so instead of "try again", which cannot
        // work for a request the server will keep rejecting (DEV-6866).
        this.failureReason.set(userFacingReason(error));
        this.failed.set(true);
        // Last, so the failure state is committed before the global handler runs and a throw there
        // cannot bring the eternal spinner back (DEV-6872). It would still error this stream and
        // leave retry dead, which is why `AppErrorHandler.handleError` is written not to throw.
        this._errorHandler.handleError(error);
        return of(null);
      })
    );
  }

  /**
   * "The class has resources but none came back" is what distinguishes missing permissions from an
   * empty class. Two things defeat that inference and both fall back to can-view:
   *   - an unknown count, because a timed-out count must never tell the user they lack permissions;
   *   - active filters, because zero results is the *expected* outcome of narrowing and the empty
   *     state has to win over the permissions panel.
   */
  private _applyCount(resources: ReadResource[], pageIndex: number, numberOfResults: number | null): ReadResource[] {
    this.userCanViewResources =
      numberOfResults === null ||
      this.filtersAreActive ||
      !(pageIndex === 0 && resources.length === 0 && numberOfResults > 0);

    // Passed through unchanged, null included: resources-list states that the count is unavailable
    // rather than asserting a total we do not have.
    this._resourceResult.numberOfResults = numberOfResults;
    return resources;
  }

  /**
   * Auto-select the first result only on entry to the class, so a re-query never yanks the viewer.
   * The memory lives on `DataBrowserPageService` because a List/Table switch recreates this fetcher.
   */
  private _applySelection(resources: ReadResource[]): { resources: ReadResource[]; selectFirstResource: boolean } {
    const isClassEntry = this.classLabel !== this._dataBrowserPageService.selectionResolvedForClass;
    this._dataBrowserPageService.selectionResolvedForClass = this.classLabel;

    if (isClassEntry && !this._multipleViewerService.selectMode) {
      if (resources.length >= 1) {
        this._multipleViewerService.selectOneResource(resources[0]);
      } else {
        // Only on entry: a filter that narrows to nothing must leave the viewer alone.
        this._multipleViewerService.reset();
      }
    }

    return { resources, selectFirstResource: isClassEntry };
  }

  private _pagedResources$(query: string, projectIri: string) {
    return this._resourceResult.pageIndex$.pipe(
      tap(() => this._resourceResult.markLoading()),
      switchMap(pageIndex =>
        this._performGravSearch(query, pageIndex, projectIri).pipe(
          map(response => ({ resources: response.resources, pageIndex }))
        )
      )
    );
  }

  /**
   * The count only drives the paginator and the permissions heuristic above, but it re-runs the same
   * WHERE clause as the paged query and carries the same cost profile (DEV-6809). Sharing one
   * `combineLatest` meant a count timeout errored the whole stream and threw away resources that had
   * arrived perfectly well, so the count absorbs its own failure and reports an unknown count.
   */
  private _countQuery$(query: string, projectIri: string) {
    return this._dspApiConnection.v2.search.doExtendedSearchCountQuery(query, projectIri).pipe(
      map(response => response.numberOfResults),
      // Reported, not surfaced: the resources rendered fine and an error toast over a working list is
      // noise, but the cost of this query is exactly what DEV-6809 and DEV-6864 are about, so it must
      // not stay invisible.
      catchError((error: unknown) => {
        this._errorReporting.report(error, {
          component: 'ResourcesListFetcherComponent',
          operation: 'gravsearchCountQuery',
        });
        return of(null);
      })
    );
  }

  private _performGravSearch(query: string, index: number, projectIri: string) {
    // `lastIndexOf`: a fulltext term can contain the word OFFSET.
    const offsetAt = query.lastIndexOf('OFFSET');
    const gravsearch = `${offsetAt === -1 ? query : query.substring(0, offsetAt)}OFFSET ${index}`;

    // Project-scoped, here and on the count: otherwise the search spans every readable project.
    return this._dspApiConnection.v2.search.doExtendedSearch(gravsearch, projectIri);
  }
}
