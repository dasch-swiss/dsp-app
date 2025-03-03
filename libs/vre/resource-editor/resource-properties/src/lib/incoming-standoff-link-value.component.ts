import { Component, Input } from '@angular/core';
import { IncomingOrStandoffLink } from './incoming-link.interface';

@Component({
  selector: 'app-incoming-standoff-link-value',
  template: `
    <div *ngFor="let link of links">
      <a style="display: block" class="resource-editor-value" [routerLink]="link.uri" target="_blank">
        <span>{{ link.project }}</span
        >:
        <strong>{{ link.label }}</strong>
      </a>
    </div>
  `,
})
export class IncomingStandoffLinkValueComponent {
  @Input({ required: true }) links!: IncomingOrStandoffLink[];
}
