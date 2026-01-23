import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { map } from 'rxjs';
import { SearchResultComponent } from './search-result.component';

@Component({
  selector: 'app-fulltext-search-results-page',
  template: `@if (query$ | async; as query) {
    <div class="content">
      <app-search-result [query]="query" [showProjectShortname]="true" />
    </div>
  } `,
  imports: [AsyncPipe, SearchResultComponent],
  styleUrls: ['./fulltext-search-results-page.component.scss'],
})
export class FulltextSearchResultsPageComponent {
  query$ = this._route.params.pipe(map(v => v[RouteConstants.qParameter]));

  constructor(private readonly _route: ActivatedRoute) {}
}
