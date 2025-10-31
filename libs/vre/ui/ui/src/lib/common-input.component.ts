import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { HumanReadableErrorPipe } from './human-readable-error.pipe';

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
  imports: [HumanReadableErrorPipe, MatFormFieldModule, MatIconModule, MatInputModule, ReactiveFormsModule],
  standalone: true,
})
export class CommonInputComponent {
  @Input({ required: true }) control!: FormControl<string | number>;
  @Input({ required: true }) label!: string;
  @Input() withLabel = true;
  @Input() prefixIcon: string | null = null;
  @Input() validatorErrors: { errorKey: string; message: string }[] | null = null;
  @Input() type: 'number' | 'text' = 'text';
}
