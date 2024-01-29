// Custom validator function
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function arrayLengthGreaterThanZeroValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: any[] = control.value;

    if (value && value.length > 0) {
      return null;
    }

    return { required: true };
  };
}
