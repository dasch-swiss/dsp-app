import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * shortcodeValidator: Validate the shortcode value against
 * already existing shortcodes.
 * @param shortcodes - existing shortcodes
 */
export function shortcodeExistsValidator(shortcodes: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return shortcodes.some(e => e.toLowerCase().search(control.value.toLowerCase()) !== -1)
      ? { shortcodeExists: true }
      : null;
  };
}
