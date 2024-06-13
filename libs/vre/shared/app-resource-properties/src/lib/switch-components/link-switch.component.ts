import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ReadLinkValue, ReadValue } from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-link-switch',
  template: ` <ng-container *ngIf="displayMode; else editMode"
      ><a [href]="link" target="_blank">{{ value }}</a>
    </ng-container>
    <ng-template #editMode>
      <app-link-value
        [control]="control"
        [propIri]="propIri"
        [resourceClassIri]="resourceClassIri"
        [defaultValue]="value"></app-link-value>
    </ng-template>`,
})
export class LinkSwitchComponent implements IsSwitchComponent {
  @Input() control!: FormControl<string>;
  @Input() displayMode = true;
  @Input() propIri!: string;
  @Input() values: ReadValue[] | undefined;
  @Input({ required: true }) resourceClassIri!: string;

  get value() {
    if (!this.values || this.values.length === 0) {
      return '';
    }
    const found = (this.values as ReadLinkValue[]).find(v => v.linkedResourceIri === this.control.value);
    if (found) {
      return found.strval;
    }
    return '';
  }

  get link() {
    return this.control.value ? `/resource${this._resourceService.getResourcePath(this.control.value)}` : '#';
  }

  constructor(private _resourceService: ResourceService) {}
}
