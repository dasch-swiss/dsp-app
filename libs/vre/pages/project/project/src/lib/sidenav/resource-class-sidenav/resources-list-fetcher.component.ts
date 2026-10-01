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
import { BehaviorSubject, catchError, combineLatest, first, map, Observable, of, skip, switchMap } from 'rxjs';
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
          <!-- The count and pager live in the class header now, above the split. -->
          <app-resources-list [resources]="data.resources" [showResultCount]="false" />
        } @else if (filtersAreActive) {
          <!-- Distinct from noResourcesFound: "this class is empty" and "your filter matched
               nothing" call for different next actions, and conflating them reads as data loss. -->
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
  // No `ResourceResultService` here on purpose: the class view provides it so this component and the
  // result count in the class header read one instance. Providing it locally shadowed the view's and
  // left the header counting a different query.
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

  /**
   * The class this component last auto-selected a resource for.
   *
   * Auto-selecting the first result is an *entry* behaviour — it is what makes the viewer show
   * something when you click a class in the sidenav. Re-running it on a filter change, a sort change
   * or a retry would yank the viewer away from whatever the user was reading, so every re-query
   * within one class leaves the selection alone.
   */
  private _autoSelectedClass: string | null = null;

  /**
   * Latest `hasActiveState$`, mirrored into a field rather than combined into the data stream.
   * Folding it into the `combineLatest` would make it a *trigger* — toggling a filter would fire a
   * second request alongside the one the query change already causes.
   */
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

    // Creating a resource adds a row this list cannot predict, so the panel pings the page service
    // and the list reloads. Folded into the retry subject rather than merged in as a second outer
    // trigger: `onNavigationReload$` is a BehaviorSubject and would otherwise replay on subscribe and
    // run the initial load twice. `skip(1)` drops exactly that replayed value.
    this._dataBrowserPageService.onNavigationReload$
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this._retrySubject.next());
  }

  ngOnChanges() {
    this.failed.set(false);
    this.failureReason.set(undefined);

    this.data$ = this._retrySubject.pipe(switchMap(() => this._data$()));
  }

  onRetry() {
    // The retry subject is the outermost operator of `data$`, so re-entering it rebuilds the whole
    // chain. That matters: `catchError` completes the inner stream, so retrying from anywhere inside
    // it could never emit again.
    //
    // Nothing is reset here beyond the failure flags. Filters, term and sort live in the URL and the
    // page index in the shared result service, so rebuilding the chain re-reads all four as they
    // were — a retry repeats the request that failed rather than silently returning to page 1 of an
    // unfiltered list.
    this.failed.set(false);
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
        // `switchMap` over the query, not `combineLatest` with it: a filter change invalidates the
        // request in flight, and letting the superseded response land would paint results for a
        // filter the URL no longer carries.
        this._query.query$.pipe(
          switchMap((query, queryIndex) => {
            // A new query is a new result set, so the old offset points into results that no longer
            // exist. Reset here rather than in a `tap` upstream: by the time this projection runs,
            // `switchMap` has already torn down the previous inner subscription, so the reset cannot
            // fire one wasted request for the superseded query.
            //
            // Skipped for the first query — the subject already starts at 0, and resetting would
            // push a redundant emission ahead of the first request.
            if (queryIndex > 0) {
              this._resourceResult.updatePageIndex(0);
            }

            return combineLatest([this._pagedResources$(query, project.id), this._countQuery$(query, project.id)]);
          })
        )
      ),
      map(([{ resources, pageIndex }, numberOfResults]) => this._applyCount(resources, pageIndex, numberOfResults))
    );

    return resources$.pipe(
      map(resources => this._applySelection(resources)),
      catchError((error: unknown) => {
        // Drop any previously known total: after a failed page change the old count describes results
        // that are no longer on screen, and leaving it would break the service's "null means genuinely
        // unknown" contract for as long as the failure state lasts.
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
   *     state has to win over the permissions panel (REQ-2.7).
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

  private _applySelection(resources: ReadResource[]): { resources: ReadResource[]; selectFirstResource: boolean } {
    const isClassEntry = this.classLabel !== this._autoSelectedClass;
    this._autoSelectedClass = this.classLabel;

    if (isClassEntry && !this._multipleViewerService.selectMode) {
      if (resources.length >= 1) {
        this._multipleViewerService.selectOneResource(resources[0]);
      } else {
        // Only on entry. A filter that narrows to nothing must leave the viewer and the comparison
        // set alone — the user can widen the filter again and expects their open resource still
        // there (REQ-2.8).
        this._multipleViewerService.reset();
      }
    }

    return { resources, selectFirstResource: isClassEntry };
  }

  private _pagedResources$(query: string, projectIri: string) {
    return this._resourceResult.pageIndex$.pipe(
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
    // `lastIndexOf`, not `search`: the offset clause is the last thing in the query, but a fulltext
    // term can contain the word OFFSET, and cutting at the first occurrence would truncate the query
    // mid-clause and send a syntactically broken request.
    const offsetAt = query.lastIndexOf('OFFSET');
    const gravsearch = `${offsetAt === -1 ? query : query.substring(0, offsetAt)}OFFSET ${index}`;

    // Scoped to the project on both this and the count query: without it the Data tab searches every
    // project the user can read, which inflates the count and can leak labels across projects.
    return this._dspApiConnection.v2.search.doExtendedSearch(gravsearch, projectIri);
  }
}
