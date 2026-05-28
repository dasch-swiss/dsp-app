import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { TranslatePipe } from '@ngx-translate/core';
import { AdvancedSearchResultsComponent } from './advanced-search-results.component';
import { AdvancedSearchComponent } from './advanced-search.component';
import { provideAdvancedSearch } from './providers';

@Component({
  selector: 'app-advanced-search-page',
  imports: [
    NgClass,
    RouterLink,
    MatButton,
    MatDivider,
    MatIcon,
    TranslatePipe,
    AdvancedSearchComponent,
    AdvancedSearchResultsComponent,
  ],
  template: `
    <div class="search-bar" [ngClass]="{ big: !query() }">
      <a class="switch-btn" mat-stroked-button [routerLink]="['..', 'search']">
        <mat-icon>swap_horiz</mat-icon>
        {{ 'pages.search.advancedSearch.switchToFulltextSearch' | translate }}
      </a>
      <app-advanced-search [projectUuid]="uuid" (gravsearchQuery)="query.set($event)" />
    </div>

    @if (query()) {
      <mat-divider />
      <div class="whole-height">
        <app-advanced-search-results [query]="query()!" />
      </div>
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
