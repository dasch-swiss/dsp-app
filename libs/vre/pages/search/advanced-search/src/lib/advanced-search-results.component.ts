import { AsyncPipe } from '@angular/common';
import { Component, Inject, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceBrowserComponent } from '@dasch-swiss/vre/pages/data-browser';
import { filterNull } from '@dasch-swiss/vre/shared/app-common';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { CenteredBoxComponent, NoResultsFoundComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { BehaviorSubject, combineLatest, map, switchMap, tap } from 'rxjs';
import { QueryExecutionService } from './service/query-execution.service';

@Component({
  selector: 'app-advanced-search-results',
  imports: [
    AsyncPipe,
    CenteredBoxComponent,
    MatAnchor,
    MatIcon,
    NoResultsFoundComponent,
    ResourceBrowserComponent,
    TranslatePipe,
  ],
  template: `
    @if (resources$ | async; as resources) {
      @if (resources.length === 0) {
        <app-centered-box>
          <app-no-results-found [message]="noResultMessage" />
          <a mat-stroked-button (click)="navigateBackToSearchForm()" style="margin-top: 24px;">
            <mat-icon>chevron_left</mat-icon>{{ 'pages.dataBrowser.resourcesList.backToSearchForm' | translate }}
          </a>
        </app-centered-box>
      } @else {
        <app-resource-browser [data]="{ resources: resources, selectFirstResource: true }" />
      }
    }
  `,
  providers: [ResourceResultService],
})
export class AdvancedSearchResultsComponent implements OnChanges {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);

  @Input({ required: true }) query!: string;
  private readonly querySubject = new BehaviorSubject<string | null>(null);

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

  constructor(
    @Inject(DspApiConnectionToken) private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _resourceResultService: ResourceResultService,
    private readonly _titleService: Title,
    private readonly _queryExecutionService: QueryExecutionService
  ) {
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

  navigateBackToSearchForm() {
    this._router.navigate(['..'], {
      relativeTo: this._route,
      queryParamsHandling: 'preserve',
    });
  }
}
