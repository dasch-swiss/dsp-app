import { AbstractControl, ValidatorFn } from '@angular/forms';

/**
 * validation of existing name values. Array method (list of values)
 * Use it in a "formbuilder" group as a validator property
 *
 * @param {RegExp} valArrayRegexp List of regular expression values
 * @returns ValidatorFn
 */
export function existingNamesValidator(valArrayRegexp: [RegExp], isCaseSensitive = false): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } => {
    let name: string;

    if (control.value) {
      name = isCaseSensitive ? control.value : control.value.toLowerCase();
    }

    let no: boolean;
    for (const existing of valArrayRegexp) {
      no = existing.test(name);
      if (no) {
        return no ? { existingName: { name } } : null;
      }
    }
    return no ? { existingName: { name } } : null;
  };
}
