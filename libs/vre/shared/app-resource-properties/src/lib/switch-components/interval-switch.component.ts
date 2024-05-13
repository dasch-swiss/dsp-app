import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-interval-switch',
  template: `
    <ng-container *ngIf="displayMode; else editMode">{{ control.value.start }}- {{ control.value.end }} </ng-container>
    <ng-template #editMode>
      <app-common-input
        placeholder="start"
        [control]="control.controls.start"
        type="number"
        data-cy="start-input"></app-common-input>
      <app-common-input
        placeholder="end"
        [control]="control.controls.end"
        type="number"
        data-cy="end-input"></app-common-input>
    </ng-template>
  `,
})
export class IntervalSwitchComponent implements IsSwitchComponent {
  @Input() control!: FormGroup<{ start: FormControl<number>; end: FormControl<number> }>;
  @Input() displayMode = true;
}
