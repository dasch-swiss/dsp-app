import { Component, Input } from '@angular/core';
import { IncomingOrStandoffLink } from './incoming-link.interface';

@Component({
  selector: 'app-incoming-standoff-link-value',
  template: `
    <div *ngFor="let link of links; let last = last">
      <a style="display: block; margin-bottom: 4px" [routerLink]="link.uri" target="_blank">
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
