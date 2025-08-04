import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-common-input',
  template: `
    <mat-form-field style="width: 100%">
      <mat-label data-cy="common-input-label" *ngIf="withLabel">{{ label }}</mat-label>
      <mat-icon matIconPrefix *ngIf="prefixIcon">{{ prefixIcon }}</mat-icon>
      <input
        matInput
        data-cy="common-input-text"
        [placeholder]="label"
        [formControl]="control"
        *ngIf="type === 'text'" />
      <input
        matInput
        data-cy="common-input-number"
        [placeholder]="label"
        [formControl]="control"
        *ngIf="type === 'number'"
        type="number" />
      <mat-error *ngIf="control.errors as errors">
        {{ errors | humanReadableError: validatorErrors }}
      </mat-error>
    </mat-form-field>
  `,
  styles: [':host { display: block;}'],
  /** TODO can't mark as OnPush because it does not detect touched / pristine changes.
   This should be fixed with angular 18 form touchedChangedEvent. * */
})
export class CommonInputComponent {
  @Input({ required: true }) control!: FormControl<string | number>;
  @Input({ required: true }) label!: string;
  @Input() withLabel = true;
  @Input() prefixIcon: string | null = null;
  @Input() validatorErrors: { errorKey: string; message: string }[] | null = null;
  @Input() type: 'number' | 'text' = 'text';
}
