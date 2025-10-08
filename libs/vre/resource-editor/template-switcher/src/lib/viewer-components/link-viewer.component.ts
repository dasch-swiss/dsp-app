import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReadLinkValue } from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';

@Component({
  selector: 'app-link-viewer',
  template: `<a [href]="link" target="_blank" data-cy="link-switch">{{ value.strval }}</a>
    <app-resource-explorer-button [resourceIri]="value.linkedResourceIri" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
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

  constructor(private _resourceService: ResourceService) {}
}
