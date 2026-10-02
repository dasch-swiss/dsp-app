import { Component } from '@angular/core';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { PagerComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * The result total, and the pager once there is more than one page of them.
 *
 * The Search pages' presentation: a bordered card wrapping either the shared `PagerComponent` or a
 * plain total. The Data tab does *not* use this — it has its own `DataClassResultMetaComponent`
 * with a different design — so this is effectively `ResourcesListComponent`'s own markup, split out
 * only so the list can switch it off.
 */
@Component({
  selector: 'app-result-count',
  template: `
    @let numberOfResults = resourceResultService.numberOfResults;
    <!-- Announced, not just rendered: filtering changes this number without moving focus, so a
         screen reader would otherwise give no sign that the result set changed. -->
    <div aria-live="polite">
      @if (numberOfResults === null) {
        <!-- The count query failed. Say so rather than asserting a total we do not have: the pager
             cannot be sized either, so paging is unavailable until the next successful load. -->
        <div class="results-count" data-cy="count-unavailable">
          {{ 'pages.dataBrowser.resourcesList.countUnavailable' | translate }}
        </div>
      } @else if (numberOfResults > resourceResultService.MAX_RESULTS_PER_PAGE) {
        <app-pager (pageIndexChanged)="updatePageIndex($event)" [numberOfAllResults]="numberOfResults" />
      } @else {
        <div class="results-count">
          {{ 'pages.dataBrowser.resourcesList.resultsCount' | translate: { count: numberOfResults } }}
        </div>
      }
    </div>
  `,
  styleUrls: ['./result-count.component.scss'],
  imports: [PagerComponent, TranslatePipe],
})
export class ResultCountComponent {
  constructor(public resourceResultService: ResourceResultService) {}

  updatePageIndex(index: number) {
    this.resourceResultService.updatePageIndex(index);
  }
}
