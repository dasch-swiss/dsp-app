import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ResourceExplorerButtonComponent } from '../resource-explorer-button.component';
import { IncomingOrStandoffLink } from './incoming-link.interface';

@Component({
  selector: 'app-incoming-standoff-link-value',
  template: `
    @for (link of links; track link) {
      <div style="display: flex; align-items: flex-start">
        <a style="display: block" [routerLink]="link.uri" target="_blank">
          <span>{{ link.project }}</span
          >:
          <strong>{{ link.label }}</strong>
        </a>
        <app-resource-explorer-button [resourceIri]="link!.iri" />
      </div>
    }
  `,
  standalone: true,
  imports: [RouterLink, ResourceExplorerButtonComponent],
})
export class IncomingStandoffLinkValueComponent {
  @Input({ required: true }) links!: IncomingOrStandoffLink[];
}
