import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ErrorHandler,
  inject,
  Input,
  OnChanges,
  signal,
  SimpleChanges,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiResponseError, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ErrorReportingService, userFacingReason } from '@dasch-swiss/vre/core/error-handler';
import { ResourceBrowserComponent } from '@dasch-swiss/vre/pages/data-browser';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { filterNull } from '@dasch-swiss/vre/shared/app-common';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { CenteredBoxComponent, NoResultsFoundComponent, SearchFailedComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { SearchFlowLogger } from './service/search-flow-logger.service';

@Component({
  selector: 'app-advanced-search-results',
  imports: [
    AppProgressIndicatorComponent,
    AsyncPipe,
    CenteredBoxComponent,
    NoResultsFoundComponent,
    ResourceBrowserComponent,
    SearchFailedComponent,
    TranslateModule,
  ],
  template: `
    @let resources = resources$ | async;
    @if (failed()) {
      <app-centered-box>
        <app-search-failed [reason]="failureReason()" (retry)="onRetry()" />
      </app-centered-box>
    } @else if (!resources && queryIsExecuting()) {
      <app-centered-box>
        <app-progress-indicator />
      </app-centered-box>
    } @else if (resources) {
      @if (resources.length === 0) {
        <app-centered-box>
          <app-no-results-found [message]="'pages.search.advancedSearch.noResultsFound' | translate" />
        </app-centered-box>
      } @else {
        <app-resource-browser
          [data]="{ resources: resources, selectFirstResource: true }"
          [showResourceClass]="showResourceClass"
          [loading]="queryIsExecuting()" />
      }
    }
  `,
  providers: [ResourceResultService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchResultsComponent implements OnChanges {
  @Input({ required: true }) query!: string;
  /** Off when the query is restricted to one resource class, where every row would repeat it. */
  @Input() showResourceClass = false;

  private readonly _dspApiConnection = inject<KnoraApiConnection>(DspApiConnectionToken);
  private readonly _resourceResultService = inject(ResourceResultService);
  private readonly _titleService = inject(Title);
  private readonly _translateService = inject(TranslateService);
  private readonly _logger = inject(SearchFlowLogger);
  private readonly _projectPageService = inject(ProjectPageService);
  private readonly _errorHandler = inject(ErrorHandler);
  private readonly _errorReporting = inject(ErrorReportingService);

  private readonly querySubject = new BehaviorSubject<string | null>(null);

  readonly queryIsExecuting = signal(false);
  readonly failed = signal(false);
  /** dsp-api's own account of the failure, when it gave one fit to show. */
  readonly failureReason = signal<string | undefined>(undefined);

  readonly resources$ = this.querySubject.pipe(
    filterNull(),
    switchMap(query => {
      this.queryIsExecuting.set(true);
      this.failed.set(false);
      this.failureReason.set(undefined);
      return combineLatest([
        this._resourceResultService.pageIndex$.pipe(
          switchMap(pageNumber => this._performGravSearch$(query, pageNumber))
        ),
        this._numberOfAllResults$(query),
      ]).pipe(
        map(([resourceResponse, countResponse]) => {
          // A failed count is reported as unknown, never substituted with this page's length: that
          // would assert a wrong total to the user and silently drop the paginator.
          const total = countResponse?.numberOfResults ?? null;
          this.queryIsExecuting.set(false);
          this._logger.searchSuccess(resourceResponse.resources.length, total);
          this._resourceResultService.numberOfResults = total;
          return resourceResponse.resources;
        }),
        // Returning `of([])` here used to render the "no results found" empty state, telling the user
        // their search legitimately matched nothing when in fact it never completed (DEV-6866).
        // `of(null)` keeps the stream alive for retry while the `failed` signal drives the real state.
        catchError((err: unknown) => {
          this._logger.searchError(err);
          // Drop any previously known total: after a failed page change the old count describes results
          // that are no longer on screen, and leaving it would break the service's "null means genuinely
          // unknown" contract for as long as the failure state lasts.
          this._resourceResultService.numberOfResults = null;
          // A rejected query explains itself; the panel says so instead of "try again", which cannot
          // work for a query the server will keep rejecting (DEV-6866).
          this.failureReason.set(userFacingReason(err));
          this.queryIsExecuting.set(false);
          this.failed.set(true);
          // A 400 or 409 is dsp-api rejecting the query, and the failure panel already says so. A snackbar
          // on top outlives it: search-as-you-type can send half-typed Lucene syntax the input does
          // not catch, such as `(foo`, and the toast stayed up over the results of the finished term
          // (DEV-7370). Report it without notifying the user.
          if (isRejectedByApi(err)) {
            this._errorReporting.report(err, {
              component: 'AdvancedSearchResultsComponent',
              operation: 'gravsearchQuery',
            });
            return of(null);
          }
          // Last, so the failure state is committed before the global handler runs and a throw there
          // cannot bring the eternal spinner back (DEV-6872). It would still error this stream and
          // leave retry dead, which is why `AppErrorHandler.handleError` is written not to throw.
          this._errorHandler.handleError(err);
          return of(null);
        }),
        startWith(null)
      );
    })
  );

  constructor() {
    this._titleService.setTitle(this._translateService.instant('pages.search.advancedSearch.resultsTitle'));
  }

  onRetry() {
    // Re-emitting the same query is enough: the subject always emits, so `switchMap` re-runs the
    // search from the current page index.
    this.querySubject.next(this.query);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['query'] && changes['query'].currentValue) {
      this.querySubject.next(this.query);
    }
  }

  private _performGravSearch$(query_: string, index: number) {
    let query = this._getQuery(query_);
    query = `${query}OFFSET ${index}`;
    this._logger.searchStart(index);
    return this._dspApiConnection.v2.search.doExtendedSearch(query, this._projectPageService.currentProject.id);
  }

  private _getQuery(query: string): string {
    // Strip the trailing paging clause. Use lastIndexOf, not search/indexOf: the fulltext term is now
    // embedded in `matchFulltext(?mainRes, "…")`, so a term containing the substring "OFFSET" would make
    // indexOf cut mid-literal and corrupt the query. The real paging clause is always the final "OFFSET".
    return query.substring(0, query.lastIndexOf('OFFSET'));
  }

  /**
   * The count only drives the paginator, but it re-runs the same WHERE clause as the results query
   * and is the more expensive of the two (DEV-6809). Sharing one `combineLatest` therefore meant a
   * count timeout errored the whole stream and threw away results that had arrived perfectly well,
   * so the count absorbs its own failure and degrades to an absent count instead.
   */
  private _numberOfAllResults$(query_: string) {
    return this._dspApiConnection.v2.search
      .doExtendedSearchCountQuery(`${this._getQuery(query_)}OFFSET 0`, this._projectPageService.currentProject.id)
      .pipe(
        catchError((err: unknown) => {
          // Deliberately not a snackbar: the results rendered fine, and an error toast over a working
          // result list is noise. It is reported nonetheless — the cost of this query is exactly what
          // DEV-6809 and DEV-6864 are about. The logger stays for the dev console, being
          // isDevMode()-gated and therefore absent in production.
          this._logger.searchError(err);
          this._errorReporting.report(err, {
            component: 'AdvancedSearchResultsComponent',
            operation: 'gravsearchCountQuery',
          });
          return of(null);
        })
      );
  }
}

/**
 * The statuses with which dsp-api rejects the query itself. Other 4xx keep the snackbar: a 401 or 403 on
 * this page means the session or the permissions changed, and the panel's generic wording would hide it.
 */
const QUERY_REJECTED_STATUSES = new Set([400, 409]);

function isRejectedByApi(err: unknown): boolean {
  const status = err instanceof ApiResponseError || err instanceof HttpErrorResponse ? err.status : undefined;
  return status !== undefined && QUERY_REJECTED_STATUSES.has(status);
}
