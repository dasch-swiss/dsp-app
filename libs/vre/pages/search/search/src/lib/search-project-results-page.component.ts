import { Component, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { ResourceResultService } from '@dasch-swiss/vre/pages/data-browser';
import { combineLatest, map, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-search-project-results-page',
  template: ` <app-progress-indicator *ngIf="loading" />
    <ng-container *ngIf="resources$ | async as resources">
      <h2 *ngIf="resources.length === 0" style="text-align: center;margin-top: 50px;">There is no result.</h2>
      <app-resource-browser
        *ngIf="resources.length > 0"
        [data]="{ resources: resources, selectFirstResource: true }"
        [hasRightsToShowCreateLinkObject$]="userIsSysAdmin$"
        [searchKeyword]="query" />
    </ng-container>`,
  providers: [ResourceResultService],
})
export class SearchProjectResultsPageComponent {
  query?: string;
  loading = true;
  userIsSysAdmin$ = this._userService.isSysAdmin$;

  readonly resources$ = this._route.params.pipe(
    map(params => ({
      query: params[RouteConstants.qParameter],
      project: params['project'],
    })),
    tap(v => {
      this.query = v.query;
    }),
    switchMap(params =>
      combineLatest([
        this._resourceResultService.pageIndex$.pipe(
          switchMap(pageNumber =>
            this._dspApiConnection.v2.search.doFulltextSearch(params.query, pageNumber, {
              limitToProject: decodeURIComponent(params.project),
            })
          )
        ),
        this._dspApiConnection.v2.search.doFulltextSearchCountQuery(params.query, 0, {
          limitToProject: decodeURIComponent(params.project),
        }),
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
}
