import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceBrowserComponent } from '@dasch-swiss/vre/pages/data-browser';
import { filterNull } from '@dasch-swiss/vre/shared/app-common';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { CenteredBoxComponent, NoResultsFoundComponent } from '@dasch-swiss/vre/ui/ui';
import { BehaviorSubject, combineLatest, map, switchMap, tap } from 'rxjs';
import { QueryExecutionService } from './service/query-execution.service';

@Component({
  selector: 'app-advanced-search-results',
  imports: [
    AppProgressIndicatorComponent,
    AsyncPipe,
    CenteredBoxComponent,
    NoResultsFoundComponent,
    ResourceBrowserComponent,
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
          <app-no-results-found [message]="noResultMessage" />
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
  private readonly _queryExecutionService = inject(QueryExecutionService);

  private readonly querySubject = new BehaviorSubject<string | null>(null);

  readonly queryIsExecuting = this._queryExecutionService.queryIsExecuting;

  readonly resources$ = this.querySubject.pipe(
    filterNull(),
    switchMap(query =>
      combineLatest([
        this._resourceResultService.pageIndex$.pipe(
          switchMap(pageNumber => this._performGravSearch$(query, pageNumber))
        ),
        this._numberOfAllResults$(query),
      ])
    ),
    tap(() => {
      this._queryExecutionService.queryIsExecuting.set(false);
    }),
    map(([resourceResponse, countResponse]) => {
      this._resourceResultService.numberOfResults = countResponse.numberOfResults;
      return resourceResponse.resources;
    })
  );

  readonly noResultMessage = `We couldn't find any resources matching your search criteria. Try adjusting your search parameters.`;

  constructor() {
    this._titleService.setTitle(`Advanced search results`);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['query'] && changes['query'].currentValue) {
      this.querySubject.next(this.query);
    }
  }

  private _performGravSearch$(query_: string, index: number) {
    let query = this._getQuery(query_);
    query = `${query}OFFSET ${index}`;
    this._queryExecutionService.queryIsExecuting.set(true);
    return this._dspApiConnection.v2.search.doExtendedSearch(query);
  }

  private _getQuery(query: string): string {
    return query.substring(0, query.search('OFFSET'));
  }

  private _numberOfAllResults$ = (query_: string) =>
    this._dspApiConnection.v2.search.doExtendedSearchCountQuery(`${this._getQuery(query_)}OFFSET 0`);
}
