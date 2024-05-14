import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ReadLinkValue } from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-text-html-switch',
  template: ` <div
      *ngIf="displayMode; else editMode"
      [innerHTML]="control.value"
      appHtmlLink
      (internalLinkClicked)="_openResource($event)"></div>
    <ng-template #editMode> This value cannot be edited.</ng-template>`,
})
export class TextHtmlSwitchComponent implements IsSwitchComponent {
  @Input() control!: FormControl<string | null>;
  @Input() displayMode = true;

  constructor(private _resourceService: ResourceService) {}

  _openResource(linkValue: ReadLinkValue | string) {
    const iri = typeof linkValue == 'string' ? linkValue : linkValue.linkedResourceIri;
    const path = this._resourceService.getResourcePath(iri);
    window.open(`/resource${path}`, '_blank');
  }
}
