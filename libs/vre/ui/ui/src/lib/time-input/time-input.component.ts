import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ValidatorError } from '../validator-error.interface';
import { TimeInputErrorStateMatcher } from './time-input-error-state-matcher';

// TODO this changes segment-dialog
@Component({
  selector: 'app-time-input',
  template: `
    <mat-form-field style="width: 100%">
      <mat-label>{{ label }}</mat-label>
      <input
        matInput
        [errorStateMatcher]="errorStateMatcher"
        [formControl]="control"
        appTimeFormat
        placeholder="hh:mm:ss" />
      <mat-error *ngIf="control.errors as errors">
        {{ errors | humanReadableError: possibleErrors }}
      </mat-error>
    </mat-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeInputComponent implements OnInit {
  @Input({ required: true }) control!: FormControl<number | null>;
  @Input({ required: true }) label!: string;

  possibleErrors!: ValidatorError[];
  readonly errorStateMatcher = new TimeInputErrorStateMatcher();

  ngOnInit() {
    this.possibleErrors = [
      {
        errorKey: 'pattern',
        message: 'Please enter a valid time in format hh:mm:ss',
      },
    ];
  }
}
