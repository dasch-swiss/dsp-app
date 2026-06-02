import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { SearchTipsComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { AdvancedSearchResultsComponent } from './advanced-search-results.component';
import { AdvancedSearchComponent } from './advanced-search.component';
import { provideAdvancedSearch } from './providers';

@Component({
  selector: 'app-advanced-search-page',
  imports: [NgClass, MatDivider, AdvancedSearchComponent, AdvancedSearchResultsComponent, SearchTipsComponent],
  template: `
    <div class="search-bar" [ngClass]="{ big: !query() }">
      <app-advanced-search [projectUuid]="uuid" (gravsearchQuery)="query.set($event)" />
    </div>

    @if (query()) {
      <mat-divider />
      <div class="whole-height">
        <app-advanced-search-results [query]="query()!" />
      </div>
    } @else {
      <app-search-tips />
    }
  `,
  styleUrl: './advanced-search-page.component.scss',
  providers: [provideAdvancedSearch()],
})
export class AdvancedSearchPageComponent {
  private readonly _projectPageService = inject(ProjectPageService);

  readonly query = signal<string | null>(null);

  get uuid(): string {
    return this._projectPageService.currentProjectUuid;
  }
}
