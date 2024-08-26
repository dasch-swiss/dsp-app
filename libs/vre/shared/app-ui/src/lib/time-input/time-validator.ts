import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function timeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    const timePattern = /^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    const valid = timePattern.test(value);
    return valid ? null : { invalidTime: true };
  };
}
