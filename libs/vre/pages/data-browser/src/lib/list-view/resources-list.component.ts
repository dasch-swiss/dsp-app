import { Component, Input } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { ResourceListComponent } from './resource-list.component';
import { ResultCountComponent } from './result-count.component';

@Component({
  selector: 'app-resources-list',
  template: `
    @if (loading) {
      <app-progress-indicator data-testid="loader" />
    } @else {
      @if (showResultCount) {
        <app-result-count />
      }
      <app-resource-list
        [resources]="resources"
        [showProjectShortname]="showProjectShortname"
        [showResourceClass]="showResourceClass" />
    }
  `,
  imports: [AppProgressIndicatorComponent, ResourceListComponent, ResultCountComponent],
})
export class ResourcesListComponent {
  @Input({ required: true }) resources!: ReadResource[];
  @Input() showProjectShortname = false;
  @Input() showResourceClass = false;
  @Input() loading = false;

  /**
   * Whether to render the count and pager above the list.
   *
   * The two Search pages keep them here. The Data tab turns them off and renders `app-result-count`
   * in its class header instead, where the PRD's three-row layout puts them — above the split, not
   * inside the list column.
   */
  @Input() showResultCount = true;
}
