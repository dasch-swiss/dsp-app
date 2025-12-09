import { Component, Input } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { ResourceActionsComponent } from './resource-actions.component';
import { ResourceMoreMenuComponent } from './resource-edit-more-menu/resource-more-menu.component';

@Component({
  selector: 'app-resource-toolbar',
  template: `
    <app-resource-actions [resource]="resource">
      <app-resource-more-menu [resource]="resource" />
    </app-resource-actions>
  `,
  standalone: true,
  imports: [ResourceActionsComponent, ResourceMoreMenuComponent],
})
export class ResourceToolbarComponent {
  @Input({ required: true }) resource!: ReadResource;
}
