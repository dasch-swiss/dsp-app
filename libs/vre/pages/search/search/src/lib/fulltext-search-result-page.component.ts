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
    @if (loading) {
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
    }
  `,
  providers: [ResourceResultService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
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

  readonly noResultMessage = 'There are no resources to display.';

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
