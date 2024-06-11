import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-common-input',
  template: `
    <mat-form-field style="width: 100%">
      <mat-label>{{ label }}</mat-label>
      <mat-icon matIconPrefix *ngIf="prefixIcon">{{ prefixIcon }}</mat-icon>
      <input matInput [placeholder]="label" [formControl]="control" [type]="type" />
      <mat-error *ngIf="control.errors as errors">
        {{ errors | humanReadableError: validatorErrors }}
      </mat-error>
    </mat-form-field>
  `,
  styles: [':host { display: block;}'],
})
export class CommonInputComponent {
  @Input({ required: true }) control: FormControl<string | number>;
  @Input({ required: true }) label: string;
  @Input() prefixIcon: string | null = null;
  @Input() validatorErrors: { errorKey: string; message: string }[] | null = null;
  @Input() type: 'number' | 'text' = 'text';
}
