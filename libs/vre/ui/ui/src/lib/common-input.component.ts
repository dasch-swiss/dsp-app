import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { HumanReadableErrorPipe } from './human-readable-error.pipe';

@Component({
  selector: 'app-common-input',
  template: `
    <mat-form-field style="width: 100%" [subscriptSizing]="showsError ? 'dynamic' : 'fixed'">
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
})
export class CommonInputComponent {
  @Input({ required: true }) control!: FormControl<string | number>;
  @Input({ required: true }) label!: string;
  @Input() withLabel = true;
  @Input() prefixIcon: string | null = null;
  @Input() validatorErrors: { errorKey: string; message: string }[] | null = null;
  @Input() type: 'number' | 'text' = 'text';

  /**
   * Whether the form field is currently displaying its error message, which decides how the
   * subscript below the field is sized (DEV-7450).
   *
   * `fixed` reserves one line of space whether or not a message is shown; that reserved line is
   * what separates stacked fields in every form built on this component. `dynamic` collapses it
   * to nothing when there is no message, which is why switching this component to `dynamic`
   * unconditionally made adjacent fields touch across the app.
   *
   * `dynamic` is still needed while a message *is* shown: a long translated error wraps onto a
   * second line and a fixed subscript clips it (DEV-7283). Sizing per state satisfies both.
   *
   * The condition mirrors Angular Material's default ErrorStateMatcher (invalid *and* touched)
   * rather than `control.errors` alone — an untouched empty required field has errors but shows
   * none, and sizing on that would collapse the spacing of every pristine form on load.
   */
  get showsError(): boolean {
    return this.control.invalid && this.control.touched;
  }
}
