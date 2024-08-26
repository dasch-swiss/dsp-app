import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { secondsToTimeString } from '@dasch-swiss/vre/shared/app-ui';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-interval-switch',
  template: `
    <ng-container *ngIf="displayMode; else editMode"
      >{{ secondsToTimeString(control.value.start) }}{{ ' ' }}- {{ secondsToTimeString(control.value.end) }}
    </ng-container>
    <ng-template #editMode>
      <app-time-input label="Start" [control]="control.controls.start" />
      <app-time-input label="End" [control]="control.controls.end" />
    </ng-template>
  `,
})
export class IntervalSwitchComponent implements IsSwitchComponent {
  @Input() control!: FormGroup<{ start: FormControl<number>; end: FormControl<number> }>;
  @Input() displayMode = true;

  secondsToTimeString(value: number) {
    return secondsToTimeString(value);
  }
}
