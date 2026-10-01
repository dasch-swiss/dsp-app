import { Component } from '@angular/core';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { PagerComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * The result total, and the pager once there is more than one page of them.
 *
 * Extracted from `ResourcesListComponent` so the Data tab can render it in its class header, above
 * the split, while the two Search pages keep it where it has always been — inside the list column.
 * One implementation rather than two: the count-unavailable branch and the page-size threshold are
 * both easy to get subtly wrong, and a second copy would drift.
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
