import { Component } from '@angular/core';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { PagerComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';

/** The result total, and the pager once there is more than one page of them. */
@Component({
  selector: 'app-result-count',
  template: `
    @let numberOfResults = resourceResultService.numberOfResults;
    <!-- Filtering changes this number without moving focus, so it is a live region. -->
    <div aria-live="polite">
      @if (numberOfResults === null) {
        <!-- The count query failed: no total to assert and no pager to size. -->
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
