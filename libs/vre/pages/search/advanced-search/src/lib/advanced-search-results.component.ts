import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input, OnChanges, signal, SimpleChanges } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceBrowserComponent } from '@dasch-swiss/vre/pages/data-browser';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { filterNull } from '@dasch-swiss/vre/shared/app-common';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { CenteredBoxComponent, NoResultsFoundComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, catchError, combineLatest, map, of, startWith, switchMap, tap } from 'rxjs';
import { SearchFlowLogger } from './service/search-flow-logger.service';

@Component({
  selector: 'app-advanced-search-results',
  imports: [
    AppProgressIndicatorComponent,
    AsyncPipe,
    CenteredBoxComponent,
    NoResultsFoundComponent,
    ResourceBrowserComponent,
    TranslateModule,
  ],
  template: `
    @let resources = resources$ | async;
    @if (!resources && queryIsExecuting()) {
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
          [loading]="queryIsExecuting()" />
      }
    }
  `,
  providers: [ResourceResultService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchResultsComponent implements OnChanges {
  @Input({ required: true }) query!: string;

  private readonly _dspApiConnection = inject<KnoraApiConnection>(DspApiConnectionToken);
  private readonly _resourceResultService = inject(ResourceResultService);
  private readonly _titleService = inject(Title);
  private readonly _translateService = inject(TranslateService);
  private readonly _logger = inject(SearchFlowLogger);
  private readonly _projectPageService = inject(ProjectPageService);

  private readonly querySubject = new BehaviorSubject<string | null>(null);

  readonly queryIsExecuting = signal(false);

  readonly resources$ = this.querySubject.pipe(
    filterNull(),
    switchMap(query => {
      this.queryIsExecuting.set(true);
      return combineLatest([
        this._resourceResultService.pageIndex$.pipe(
          switchMap(pageNumber => this._performGravSearch$(query, pageNumber))
        ),
        this._numberOfAllResults$(query),
      ]).pipe(
        tap(([resourceResponse, countResponse]) => {
          this.queryIsExecuting.set(false);
          this._logger.searchSuccess(resourceResponse.resources.length, countResponse.numberOfResults);
        }),
        map(([resourceResponse, countResponse]) => {
          this._resourceResultService.numberOfResults = countResponse.numberOfResults;
          return resourceResponse.resources;
        }),
        catchError(err => {
          this._logger.searchError(err);
          this.queryIsExecuting.set(false);
          return of([]);
        }),
        startWith(null)
      );
    })
  );

  constructor() {
    this._titleService.setTitle(this._translateService.instant('pages.search.advancedSearch.resultsTitle'));
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

  private _numberOfAllResults$(query_: string) {
    return this._dspApiConnection.v2.search.doExtendedSearchCountQuery(
      `${this._getQuery(query_)}OFFSET 0`,
      this._projectPageService.currentProject.id
    );
  }
}
