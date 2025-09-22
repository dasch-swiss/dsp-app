import { Component, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { ResourceResultService } from '@dasch-swiss/vre/pages/data-browser';
import { combineLatest, map, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-search-project-results-page',
  template: ` @if (loading) {
      <app-progress-indicator />
    }
    @if (resources$ | async; as resources) {
      @if (resources.length === 0) {
        <app-centered-box>
          <app-no-results-found [message]="noResultMessage" />
        </app-centered-box>
      }
      @if (resources.length > 0) {
        <app-resource-browser
          [data]="{ resources: resources, selectFirstResource: true }"
          [hasRightsToShowCreateLinkObject$]="userIsSysAdmin$"
          [searchKeyword]="query" />
      }
    }`,
  providers: [ResourceResultService],
})
export class SearchProjectResultsPageComponent {
  query?: string;
  loading = true;
  userIsSysAdmin$ = this._userService.isSysAdmin$;

  readonly noResultMessage = 'There are no resources to display.';

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
