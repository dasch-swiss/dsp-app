import { AsyncPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ResourceBrowserComponent } from '@dasch-swiss/vre/pages/data-browser';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { CenteredBoxComponent, NoResultsFoundComponent } from '@dasch-swiss/vre/ui/ui';
import { combineLatest, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-advanced-search-results-page',
  imports: [AsyncPipe, MatButton, MatIcon, CenteredBoxComponent, NoResultsFoundComponent, ResourceBrowserComponent],
  template: `
    @if (resources$ | async; as resources) {
      @if (resources.length === 0) {
        <app-centered-box>
          <app-no-results-found [message]="noResultMessage" />
          <a mat-stroked-button (click)="navigate()"><mat-icon>chevron_left</mat-icon>Back to search form</a>
        </app-centered-box>
      } @else {
        <app-resource-browser
          [data]="{ resources: resources, selectFirstResource: true }"
          [showBackToFormButton]="true" />
      }
    }
  `,
  providers: [ResourceResultService],
})
export class AdvancedSearchResultsPageComponent {
  readonly resources$ = this._route.params.pipe(
    switchMap(params =>
      combineLatest([
        this._resourceResultService.pageIndex$.pipe(
          switchMap(pageNumber => this._performGravSearch(params, pageNumber))
        ),
        this._numberOfAllResults$(params),
      ])
    ),
    map(([resourceResponse, countResponse]) => {
      this._resourceResultService.numberOfResults = countResponse.numberOfResults;
      return resourceResponse.resources;
    })
  );

  readonly noResultMessage = `We couldn't find any resources matching your search criteria. Try adjusting your search parameters.`;

  constructor(
    @Inject(DspApiConnectionToken) private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _resourceResultService: ResourceResultService,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _titleService: Title
  ) {
    this._titleService.setTitle(`Advanced search results`);
  }

  private _performGravSearch(params: Params, index: number) {
    let query = this._getQuery(params);
    query = `${query}OFFSET ${index}`;

    return this._dspApiConnection.v2.search.doExtendedSearch(query);
  }

  private _getQuery(params: Params) {
    const query = decodeURIComponent(params['q']);
    return query.substring(0, query.search('OFFSET'));
  }

  private _numberOfAllResults$ = (params: Params) =>
    this._dspApiConnection.v2.search.doExtendedSearchCountQuery(`${this._getQuery(params)}OFFSET 0`);

  navigate() {
    const projectUuid = this._route.parent?.snapshot.params['uuid'];
    this._router.navigate([RouteConstants.project, projectUuid, RouteConstants.advancedSearch]);
  }
}
