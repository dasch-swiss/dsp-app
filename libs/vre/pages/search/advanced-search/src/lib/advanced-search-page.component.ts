import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDivider } from '@angular/material/divider';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { SearchTipsComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { AdvancedSearchResultsComponent } from './advanced-search-results.component';
import { provideAdvancedSearch } from './providers';
import { DerivedSearchStateService } from './service/derived-search-state.service';
import { AdvancedSearchBarComponent } from './ui/chip-bar/advanced-search-bar.component';

@Component({
  selector: 'app-advanced-search-page',
  imports: [MatDivider, AdvancedSearchBarComponent, AdvancedSearchResultsComponent, SearchTipsComponent],
  template: `
    <div class="search-bar">
      <div class="search-bar__inner">
        <app-advanced-search-bar [projectUuid]="uuid" />
      </div>
    </div>

    <mat-divider />
    @if (query()) {
      <div class="whole-height">
        <app-advanced-search-results [query]="query()!" />
      </div>
    } @else {
      <app-search-tips
        style="
    display: flex;
    padding: 16px;" />
    }
  `,
  styleUrl: './advanced-search-page.component.scss',
  providers: [provideAdvancedSearch()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchPageComponent {
  private readonly _projectPageService = inject(ProjectPageService);
  private readonly _derivation = inject(DerivedSearchStateService);

  // Query is derived purely from the URL — the same pipeline serves first load, back/forward, and
  // user actions.
  readonly query = toSignal(this._derivation.gravsearchQuery$, { initialValue: null });

  get uuid(): string {
    return this._projectPageService.currentProjectUuid;
  }
}
