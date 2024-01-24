import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

/**
 * shortcodeValidator: Validate the shortcode value against
 * already existing shortcodes.
 * @param shortcodes - existing shortcodes
 */
export function shortcodeExistsValidator(shortcodes: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return shortcodes.includes(control.value) ? { shortcodeExists: true } : null;
  };
}
