import { Component, Input } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { PagerComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { ResourceListComponent } from './resource-list.component';

@Component({
  selector: 'app-resources-list',
  template: `
    @if (loading) {
      <app-progress-indicator data-testid="loader" />
    } @else {
      @if (resourceResultService.numberOfResults > resourceResultService.MAX_RESULTS_PER_PAGE) {
        <app-pager
          (pageIndexChanged)="updatePageIndex($event)"
          [numberOfAllResults]="resourceResultService.numberOfResults" />
      } @else {
        <div class="results-count">
          {{
            'pages.dataBrowser.resourcesList.resultsCount' | translate: { count: resourceResultService.numberOfResults }
          }}
        </div>
      }
      <app-resource-list [resources]="resources" [showProjectShortname]="showProjectShortname" />
    }
  `,
  styleUrls: ['./resources-list.component.scss'],
  imports: [AppProgressIndicatorComponent, PagerComponent, ResourceListComponent, TranslatePipe],
})
export class ResourcesListComponent {
  @Input({ required: true }) resources!: ReadResource[];
  @Input() showProjectShortname = false;
  @Input() loading = false;

  constructor(public resourceResultService: ResourceResultService) {}

  updatePageIndex(index: number) {
    this.resourceResultService.updatePageIndex(index);
  }
}
