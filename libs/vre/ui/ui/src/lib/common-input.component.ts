import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-common-input',
  template: `
    <mat-form-field style="width: 100%">
      @if (withLabel) {
        <mat-label data-cy="common-input-label">{{ label }}</mat-label>
      }
      @if (prefixIcon) {
        <mat-icon matIconPrefix>{{ prefixIcon }}</mat-icon>
      }
      @if (type === 'text') {
        <input matInput data-cy="common-input-text" [placeholder]="label" [formControl]="control" />
      }
      @if (type === 'number') {
        <input matInput data-cy="common-input-number" [placeholder]="label" [formControl]="control" type="number" />
      }
      @if (control.errors; as errors) {
        <mat-error>
          {{ errors | humanReadableError: validatorErrors }}
        </mat-error>
      }
    </mat-form-field>
  `,
  styles: [':host { display: block;}'],
  standalone: false,
})
export class CommonInputComponent {
  @Input({ required: true }) control!: FormControl<string | number>;
  @Input({ required: true }) label!: string;
  @Input() withLabel = true;
  @Input() prefixIcon: string | null = null;
  @Input() validatorErrors: { errorKey: string; message: string }[] | null = null;
  @Input() type: 'number' | 'text' = 'text';
}
