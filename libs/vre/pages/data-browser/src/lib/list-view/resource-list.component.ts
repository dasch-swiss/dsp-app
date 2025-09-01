import { Component, Input } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-resource-list',
  template: ` <app-resource-list-item *ngFor="let resource of resources" [resource]="resource" /> `,
})
export class ResourceListComponent {
  @Input({ required: true }) resources: ReadResource[] = [];
}
