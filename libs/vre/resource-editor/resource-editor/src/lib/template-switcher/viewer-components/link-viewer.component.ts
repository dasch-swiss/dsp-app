import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReadLinkValue } from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { ResourceExplorerButtonComponent } from '../../resource-explorer-button.component';

@Component({
  selector: 'app-link-viewer',
  imports: [ResourceExplorerButtonComponent],
  template: `<a [href]="link" target="_blank" data-cy="link-switch">{{ value.strval }}</a>
    <app-resource-explorer-button [resourceIri]="value.linkedResourceIri" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  styles: [
    `
      :host {
        display: flex;
      }
    `,
  ],
})
export class LinkViewerComponent {
  @Input({ required: true }) value!: ReadLinkValue;

  get link() {
    return `/resource${this._resourceService.getResourcePath(this.value.linkedResourceIri)}`;
  }

  constructor(private readonly _resourceService: ResourceService) {}
}
