import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ValidatorError } from '@dasch-swiss/vre/shared/app-string-literal';
import { TimeInputErrorStateMatcher } from './time-input-error-state-matcher';

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
})
export class TimeInputComponent implements OnInit {
  @Input({ required: true }) control!: FormControl;
  @Input({ required: true }) label!: string;
  @Input() validatorErrors: ValidatorError[] | null = null;

  possibleErrors!: ValidatorError[];
  readonly errorStateMatcher = new TimeInputErrorStateMatcher();

  ngOnInit() {
    this.possibleErrors = [
      {
        errorKey: 'pattern',
        message: 'Please enter a valid time in format hh:mm:ss',
      },
      ...(this.validatorErrors ?? []),
    ];
  }
}
