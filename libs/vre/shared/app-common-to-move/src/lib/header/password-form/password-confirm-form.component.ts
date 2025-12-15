import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CustomRegex } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { PasswordFormFieldComponent } from './password-form-field.component';

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
  imports: [PasswordFormFieldComponent, TranslatePipe],
})
export class PasswordConfirmFormComponent implements OnInit, OnDestroy {
  @Output() afterFormInit = new EventEmitter<FormGroup>();

  form = this._fb.group({
    password: this._fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(CustomRegex.PASSWORD_REGEX),
    ]),
    confirmPassword: this._fb.control('', [Validators.required, this._confirmPasswordValidator()]),
  });

  get passwordControl() {
    return this.form.controls.password;
  }

  get confirmPasswordControl() {
    return this.form.controls.confirmPassword;
  }

  passwordValidatorErrors = [
    {
      errorKey: 'pattern',
      message: 'Password must contain at least one letter and one number.',
    },
  ];

  passwordConfirmValidatorErrors = [{ errorKey: 'passwordMismatch', message: 'Passwords do not match.' }];

  private _subscription!: Subscription;

  constructor(private readonly _fb: FormBuilder) {}

  ngOnInit(): void {
    this.afterFormInit.emit(this.form);

    // Update confirmPassword validation when password changes
    this._subscription = this.passwordControl.valueChanges.subscribe(() => {
      this.confirmPasswordControl.updateValueAndValidity({ onlySelf: true });
    });
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
  }

  private _confirmPasswordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const password = this.passwordControl?.value;
      if (!password) {
        return null;
      }

      return password === control.value ? null : { passwordMismatch: true };
    };
  }
}
