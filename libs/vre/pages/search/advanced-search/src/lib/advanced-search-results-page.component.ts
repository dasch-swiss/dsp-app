import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdvancedSearchResultsComponent } from './advanced-search-results.component';
import { QueryExecutionService } from './service/query-execution.service';

@Component({
  selector: 'app-advanced-search-results-page',
  template: `
    <div class="results-header">
      <a mat-stroked-button [routerLink]="['..']" [queryParams]="{ restore: true }">
        <mat-icon>arrow_back</mat-icon>
        {{ 'pages.dataBrowser.resourcesList.backToSearchForm' | translate }}
      </a>
    </div>
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
      .results-header {
        padding: 16px;
      }
    `,
  ],
  imports: [AdvancedSearchResultsComponent, MatButtonModule, MatIconModule, RouterLink, TranslateModule],
  providers: [QueryExecutionService],
})
export class AdvancedSearchResultsPageComponent implements OnInit {
  query?: string;

  constructor(private readonly _route: ActivatedRoute) {}

  ngOnInit(): void {
    this.query = this._route.snapshot.queryParamMap.get('q') ?? undefined;
  }
}
