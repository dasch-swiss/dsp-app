import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { HumanReadableErrorPipe } from '@dasch-swiss/vre/ui/ui';

@Component({
  selector: 'app-password-form-field',
  template: ` <mat-form-field style="width: 100%">
    <input
      matInput
      [type]="showPassword ? 'text' : 'password'"
      [formControl]="control"
      autocomplete="current-password" />
    <mat-label>{{ placeholder }}</mat-label>

    @if (showToggleVisibility) {
      <button type="button" matSuffix mat-icon-button class="input-icon" (click)="showPassword = !showPassword">
        <mat-icon> {{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
      </button>
    }

    @if (control.errors; as errors) {
      <mat-error>{{ errors | humanReadableError: validatorErrors }}</mat-error>
    }
  </mat-form-field>`,
  imports: [
    HumanReadableErrorPipe,
    MatError,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatSuffix,
    ReactiveFormsModule,
  ],
})
export class PasswordFormFieldComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input({ required: true }) placeholder!: string;
  @Input() showToggleVisibility = false;
  @Input() validatorErrors: { errorKey: string; message: string }[] | null = null;

  showPassword = false;
}
