import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HumanReadableErrorPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslateModule } from '@ngx-translate/core';
import { PasswordConfirmFormComponent } from './password-confirm-form.component';
import { PasswordFormFieldComponent } from './password-form-field.component';

describe('PasswordConfirmFormComponent', () => {
  let component: PasswordConfirmFormComponent;
  let fixture: ComponentFixture<PasswordConfirmFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PasswordConfirmFormComponent, PasswordFormFieldComponent],
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        BrowserAnimationsModule,
        TranslateModule.forRoot(),
        HumanReadableErrorPipe,
      ],
      providers: [FormBuilder],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordConfirmFormComponent);
    component = fixture.componentInstance;
  });

  describe('Form Controls Initialization', () => {
    it('should initialize password control with validators', () => {
      expect(component.passwordControl).toBeDefined();
      expect(component.passwordControl.value).toBe('');
      expect(component.passwordControl.hasError('required')).toBeTruthy();
    });

    it('should initialize confirm password control with required validator', () => {
      expect(component.confirmPasswordControl).toBeDefined();
      expect(component.confirmPasswordControl.value).toBe('');
      expect(component.confirmPasswordControl.hasError('required')).toBeTruthy();
    });

    it('should have correct validator error messages', () => {
      expect(component.passwordValidatorErrors).toEqual([
        {
          errorKey: 'pattern',
          message: 'Password must contain at least one letter and one number.',
        },
      ]);

      expect(component.passwordConfirmValidatorErrors).toEqual([
        { errorKey: 'passwordMismatch', message: 'Passwords do not match.' },
      ]);
    });
  });

  describe('ngOnInit', () => {
    it('should emit afterFormInit with passwordControl', () => {
      jest.spyOn(component.afterFormInit, 'emit');

      component.ngOnInit();

      expect(component.afterFormInit.emit).toHaveBeenCalledWith(component.passwordControl);
    });

    it('should add password match validator to confirm password control', () => {
      component.ngOnInit();

      expect(component.confirmPasswordControl.hasError('required')).toBeTruthy();
    });

    it('should subscribe to password control value changes', () => {
      component.ngOnInit();

      expect(component.subscription).toBeDefined();
    });
  });

  describe('Password Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should validate password minimum length', () => {
      component.passwordControl.setValue('abc123');

      expect(component.passwordControl.hasError('minlength')).toBeTruthy();

      component.passwordControl.setValue('abcd1234');

      expect(component.passwordControl.hasError('minlength')).toBeFalsy();
    });

    it('should validate password pattern (letter and number)', () => {
      component.passwordControl.setValue('abcdefgh'); // Only letters

      expect(component.passwordControl.hasError('pattern')).toBeTruthy();

      component.passwordControl.setValue('12345678'); // Only numbers

      expect(component.passwordControl.hasError('pattern')).toBeTruthy();

      component.passwordControl.setValue('abcd1234'); // Letters and numbers

      expect(component.passwordControl.hasError('pattern')).toBeFalsy();
    });

    it('should require password field', () => {
      component.passwordControl.setValue('');

      expect(component.passwordControl.hasError('required')).toBeTruthy();

      component.passwordControl.setValue('validPass123');

      expect(component.passwordControl.hasError('required')).toBeFalsy();
    });
  });

  describe('Password Match Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should validate password match', () => {
      const password = 'validPass123';

      component.passwordControl.setValue(password);
      component.confirmPasswordControl.setValue(password);

      expect(component.confirmPasswordControl.hasError('passwordMismatch')).toBeFalsy();
    });

    it('should invalidate when passwords do not match', () => {
      component.passwordControl.setValue('validPass123');
      component.confirmPasswordControl.setValue('differentPass456');

      expect(component.confirmPasswordControl.hasError('passwordMismatch')).toBeTruthy();
    });

    it('should not validate when either password is empty', () => {
      component.passwordControl.setValue('');
      component.confirmPasswordControl.setValue('somePassword');

      expect(component.confirmPasswordControl.hasError('passwordMismatch')).toBeFalsy();

      component.passwordControl.setValue('somePassword');
      component.confirmPasswordControl.setValue('');

      expect(component.confirmPasswordControl.hasError('passwordMismatch')).toBeFalsy();
    });

    it('should re-validate confirm password when password changes', () => {
      component.passwordControl.setValue('initialPass123');
      component.confirmPasswordControl.setValue('initialPass123');

      expect(component.confirmPasswordControl.hasError('passwordMismatch')).toBeFalsy();

      component.passwordControl.setValue('changedPass456');

      expect(component.confirmPasswordControl.hasError('passwordMismatch')).toBeTruthy();
    });
  });

  describe('Template Integration', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should render two password form fields', () => {
      const passwordFields = fixture.nativeElement.querySelectorAll('app-password-form-field');
      expect(passwordFields.length).toBe(2);
    });

    it('should pass correct properties to password field', () => {
      const passwordField = fixture.debugElement.query(
        debugEl =>
          debugEl.nativeElement.tagName === 'APP-PASSWORD-FORM-FIELD' &&
          debugEl.componentInstance.control === component.passwordControl
      );

      expect(passwordField.componentInstance.control).toBe(component.passwordControl);
      expect(passwordField.componentInstance.validatorErrors).toBe(component.passwordValidatorErrors);
      expect(passwordField.componentInstance.showToggleVisibility).toBe(true);
    });

    it('should pass correct properties to confirm password field', () => {
      const confirmPasswordField = fixture.debugElement.query(
        debugEl =>
          debugEl.nativeElement.tagName === 'APP-PASSWORD-FORM-FIELD' &&
          debugEl.componentInstance.control === component.confirmPasswordControl
      );

      expect(confirmPasswordField.componentInstance.control).toBe(component.confirmPasswordControl);
      expect(confirmPasswordField.componentInstance.validatorErrors).toBe(component.passwordConfirmValidatorErrors);
      expect(confirmPasswordField.componentInstance.showToggleVisibility).toBe(true);
    });
  });

  describe('Form Validity', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should be valid when both passwords are valid and match', () => {
      const validPassword = 'validPass123';

      component.passwordControl.setValue(validPassword);
      component.confirmPasswordControl.setValue(validPassword);

      expect(component.passwordControl.valid).toBeTruthy();
      expect(component.confirmPasswordControl.valid).toBeTruthy();
    });

    it('should be invalid when password does not meet requirements', () => {
      component.passwordControl.setValue('short'); // Too short, no numbers
      component.confirmPasswordControl.setValue('short');

      expect(component.passwordControl.valid).toBeFalsy();
      expect(component.passwordControl.hasError('minlength')).toBeTruthy();
      expect(component.passwordControl.hasError('pattern')).toBeTruthy();
    });

    it('should be invalid when passwords do not match', () => {
      component.passwordControl.setValue('validPass123');
      component.confirmPasswordControl.setValue('differentPass456');

      expect(component.confirmPasswordControl.valid).toBeFalsy();
      expect(component.confirmPasswordControl.hasError('passwordMismatch')).toBeTruthy();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscription', () => {
      component.ngOnInit();
      jest.spyOn(component.subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(component.subscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should handle special characters in password', () => {
      const passwordWithSpecialChars = 'valid@Pass123!';

      component.passwordControl.setValue(passwordWithSpecialChars);
      component.confirmPasswordControl.setValue(passwordWithSpecialChars);

      expect(component.passwordControl.valid).toBeTruthy();
      expect(component.confirmPasswordControl.valid).toBeTruthy();
    });

    it('should handle very long passwords', () => {
      const longPassword = 'a'.repeat(100) + '1';

      component.passwordControl.setValue(longPassword);
      component.confirmPasswordControl.setValue(longPassword);

      expect(component.passwordControl.valid).toBeTruthy();
      expect(component.confirmPasswordControl.valid).toBeTruthy();
    });

    it('should handle whitespace in passwords', () => {
      const passwordWithSpaces = 'valid Pass 123';

      component.passwordControl.setValue(passwordWithSpaces);
      component.confirmPasswordControl.setValue(passwordWithSpaces);

      expect(component.passwordControl.valid).toBeTruthy();
      expect(component.confirmPasswordControl.valid).toBeTruthy();
    });
  });
});
