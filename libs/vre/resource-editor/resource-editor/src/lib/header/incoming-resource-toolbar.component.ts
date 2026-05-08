import { Component, Input } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { IncomingResourceMoreMenuComponent } from './more-menu/incoming-resource-more-menu.component';
import { ResourceActionsComponent } from './resource-actions.component';

@Component({
  selector: 'app-incoming-resource-toolbar',
  template: `
    <app-resource-actions [resource]="resource">
      <app-incoming-resource-more-menu [resource]="resource" />
    </app-resource-actions>
  `,
  imports: [ResourceActionsComponent, IncomingResourceMoreMenuComponent],
})
export class IncomingResourceToolbarComponent {
  @Input({ required: true }) resource!: ReadResource;
}
