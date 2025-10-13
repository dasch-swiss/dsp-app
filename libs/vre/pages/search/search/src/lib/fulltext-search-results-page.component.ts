import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { map } from 'rxjs';

@Component({
  selector: 'app-fulltext-search-results-page',
  template: `@if (query$ | async; as query) {
    <app-project-fulltext-search-result [query]="query" />
  } `,
  standalone: false,
})
export class FulltextSearchResultsPageComponent {
  query$ = this._route.params.pipe(map(v => v[RouteConstants.qParameter]));
  constructor(private _route: ActivatedRoute) {}
}
