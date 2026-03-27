import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdvancedSearchResultsComponent } from './advanced-search-results.component';
import { QueryExecutionService } from './service/query-execution.service';

@Component({
  selector: 'app-advanced-search-results-page',
  template: `
    @if (query) {
      <app-advanced-search-results [query]="query" />
    }
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
  imports: [AdvancedSearchResultsComponent],
  providers: [QueryExecutionService],
})
export class AdvancedSearchResultsPageComponent implements OnInit {
  query?: string;

  constructor(private readonly _route: ActivatedRoute) {}

  ngOnInit(): void {
    this.query = this._route.snapshot.queryParamMap.get('q') ?? undefined;
  }
}
