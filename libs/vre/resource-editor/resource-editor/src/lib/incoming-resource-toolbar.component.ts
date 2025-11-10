import { Component, Input } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-incoming-resource-toolbar',
  template: `
    <app-resource-actions [resource]="resource">
      <app-incoming-resource-more-menu [resource]="resource" />
    </app-resource-actions>
  `,
  standalone: false,
})
export class IncomingResourceToolbarComponent {
  @Input({ required: true }) resource!: ReadResource;
}
