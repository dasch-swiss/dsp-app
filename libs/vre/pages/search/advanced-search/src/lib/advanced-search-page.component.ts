import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDivider } from '@angular/material/divider';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { AdvancedSearchBarComponent } from '@dasch-swiss/vre/pages/search/search-filters';
import { SearchTipsComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { map } from 'rxjs';
import { AdvancedSearchResultsComponent } from './advanced-search-results.component';
import { provideAdvancedSearch } from './providers';
import { DerivedSearchStateService } from './service/derived-search-state.service';
import { DataModelChipComponent } from './ui/chip-bar/data-model-chip.component';
import { ResourceClassChipComponent } from './ui/chip-bar/resource-class-chip.component';
import { OrderByComponent } from './ui/order-by/order-by.component';

@Component({
  selector: 'app-advanced-search-page',
  imports: [
    MatDivider,
    AdvancedSearchBarComponent,
    AdvancedSearchResultsComponent,
    DataModelChipComponent,
    OrderByComponent,
    ResourceClassChipComponent,
    SearchTipsComponent,
  ],
  template: `
    <div class="search-bar">
      <div class="search-bar__inner">
        <!-- The data-model, resource-class and order-by chips write query params this page owns, so they
             are projected in from here rather than built into the shared bar. The Data tab projects
             nothing: its route fixes the model and class, and it sorts by label from a column header. -->
        <app-advanced-search-bar [projectUuid]="uuid">
          <ng-container searchFiltersLeading>
            <app-data-model-chip />
            <app-resource-class-chip />
          </ng-container>
          <ng-container searchFiltersTrailing>
            <app-order-by />
          </ng-container>
        </app-advanced-search-bar>
      </div>
    </div>

    <mat-divider />
    @if (query()) {
      <div class="whole-height">
        <app-advanced-search-results [query]="query()!" [showResourceClass]="resultsCanMixClasses()" />
      </div>
    } @else {
      <app-search-tips
        style="
    display: flex;
    padding: 16px; margin-left: 8px" />
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

  /**
   * A query restricted to one resource class returns rows that all share it, so showing the class on
   * every result would only repeat the filter back at the user. Without that restriction the query is
   * anchored on knora-api:Resource and the results can mix classes, which is when the class earns its
   * place (DEV-5452).
   */
  private readonly _resourceClass = toSignal(this._derivation.searchState$.pipe(map(state => state.resourceClass)), {
    initialValue: null,
  });

  readonly resultsCanMixClasses = computed(() => this._resourceClass() === null);

  get uuid(): string {
    return this._projectPageService.currentProjectUuid;
  }
}
