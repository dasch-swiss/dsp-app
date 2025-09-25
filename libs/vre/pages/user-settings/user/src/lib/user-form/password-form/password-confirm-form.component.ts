import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CustomRegex } from '@dasch-swiss/vre/shared/app-common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-password-confirm-form',
  template: `
    <app-password-form-field
      [control]="passwordControl"
      [placeholder]="'pages.userSettings.passwordForm.newPassword' | translate"
      [validatorErrors]="passwordValidatorErrors"
      [showToggleVisibility]="true" />

    <app-password-form-field
      [control]="confirmPasswordControl"
      [placeholder]="'pages.userSettings.passwordForm.confirmPassword' | translate"
      [validatorErrors]="passwordConfirmValidatorErrors"
      [showToggleVisibility]="true" />
  `,
  standalone: false,
})
export class PasswordConfirmFormComponent implements OnInit, OnDestroy {
  @Output() afterFormInit = new EventEmitter<FormControl<string>>();

  passwordControl = this._fb.nonNullable.control('', [
    Validators.required,
    Validators.minLength(8),
    Validators.pattern(CustomRegex.PASSWORD_REGEX),
  ]);
  passwordValidatorErrors = [
    {
      errorKey: 'pattern',
      message: 'Password must contain at least one letter and one number.',
    },
  ];

  confirmPasswordControl = this._fb.control('', [Validators.required]);
  passwordConfirmValidatorErrors = [{ errorKey: 'passwordMismatch', message: 'Passwords do not match.' }];
  subscription!: Subscription;

  constructor(private _fb: FormBuilder) {}

  ngOnInit(): void {
    this.afterFormInit.emit(this.passwordControl);
    this.confirmPasswordControl.addValidators([this._passwordMatchValidator()]);

    this.subscription = this.passwordControl.valueChanges.subscribe(() => {
      this.confirmPasswordControl.updateValueAndValidity();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private _passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const confirmPassword = control.value;
      const password = this.passwordControl.value;

      if (!confirmPassword || !password) {
        return null;
      }

      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }
}
