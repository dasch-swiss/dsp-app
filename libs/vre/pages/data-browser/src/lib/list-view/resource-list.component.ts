import { Component, Input } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-resource-list',
  template: `
    @for (resource of resources; track resource) {
      <app-resource-list-item [resource]="resource" data-cy="resource-list-item" />
    }
  `,
  standalone: false,
})
export class ResourceListComponent {
  @Input({ required: true }) resources: ReadResource[] = [];
}
