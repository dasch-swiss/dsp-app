import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-list-switch',
  template: `
    <app-list-viewer *ngIf="displayMode; else editMode" [control]="control" [propertyDef]="propertyDef" />
    <ng-template #editMode>
      <app-list-value [control]="control" [propertyDef]="propertyDef" />
    </ng-template>
  `,
})
export class ListSwitchComponent implements IsSwitchComponent {
  @Input() control!: FormControl<string>;
  @Input() displayMode = true;
  @Input() propertyDef!: ResourcePropertyDefinition;
}
