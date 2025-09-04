import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { ResourceResultService } from '@dasch-swiss/vre/pages/data-browser';
import { combineLatest, map, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-fulltext-search-result-page',
  template: `
    <app-progress-indicator *ngIf="loading" />
    <ng-container *ngIf="resources$ | async as resources">
      <h2 *ngIf="resources.length === 0" style="text-align: center;margin-top: 50px;">There is no result.</h2>
      <app-resource-browser
        *ngIf="resources.length > 0"
        [data]="{ resources: resources, selectFirstResource: true }"
        [hasRightsToShowCreateLinkObject$]="userIsSysAdmin$"
        [searchKeyword]="query" />
    </ng-container>
  `,
  providers: [ResourceResultService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FulltextSearchResultPageComponent {
  loading = true;

  userIsSysAdmin$ = this._userService.isSysAdmin$;
  query!: string;
  readonly resources$ = this._route.params.pipe(
    map(params => params[RouteConstants.qParameter]),
    tap(query => {
      this.query = query;
    }),
    switchMap(query =>
      combineLatest([
        this._resourceResultService.pageIndex$.pipe(
          switchMap(pageNumber => this._dspApiConnection.v2.search.doFulltextSearch(query, pageNumber))
        ),
        this._numberOfAllResults$(query),
      ])
    ),
    map(([resourceResponse, countResponse]) => {
      this.loading = false;
      this._resourceResultService.numberOfResults = countResponse.numberOfResults;
      return resourceResponse.resources;
    })
  );

  constructor(
    private _route: ActivatedRoute,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _resourceResultService: ResourceResultService,
    private _userService: UserService
  ) {}

  private _numberOfAllResults$ = (query: string) =>
    this._dspApiConnection.v2.search.doFulltextSearchCountQuery(query, 0);
}
