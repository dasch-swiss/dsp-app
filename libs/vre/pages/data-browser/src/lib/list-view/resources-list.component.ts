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

  /** Whether to render the count and pager above the list; the Data tab's class header renders its own. */
  @Input() showResultCount = true;
}
