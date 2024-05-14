import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ReadLinkValue } from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-rich-text-switch',
  template: ` <div
      *ngIf="displayMode; else editMode"
      [innerHTML]="control.value"
      appHtmlLink
      (internalLinkClicked)="_openResource($event)"></div>
    <ng-template #editMode>
      <app-rich-text-value [control]="myControl"></app-rich-text-value>
    </ng-template>`,
})
export class RichTextSwitchComponent implements IsSwitchComponent {
  @Input() control!: FormControl<string | null>;
  @Input() displayMode = true;

  get myControl() {
    return this.control as FormControl<string>;
  }

  constructor(private _resourceService: ResourceService) {}

  _openResource(linkValue: ReadLinkValue | string) {
    const iri = typeof linkValue == 'string' ? linkValue : linkValue.linkedResourceIri;
    const path = this._resourceService.getResourcePath(iri);
    window.open(`/resource${path}`, '_blank');
  }
}
