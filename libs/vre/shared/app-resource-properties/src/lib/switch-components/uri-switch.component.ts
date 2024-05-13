import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-uri-switch',
  template: `
    <ng-container *ngIf="displayMode; else editMode"
      ><a [href]="control.value" target="_blank" style="font-weight: bold">{{ control.value }}</a>
    </ng-container>
    <ng-template #editMode>
      <app-common-input
        [control]="control"
        placeholder="External link"
        [validatorErrors]="[emailError]"></app-common-input>
    </ng-template>
  `,
})
export class UriSwitchComponent implements IsSwitchComponent {
  @Input() control!: FormControl<string>;
  @Input() displayMode = true;

  readonly emailError = { errorKey: 'pattern', message: 'This is not a valid link.' };
}
