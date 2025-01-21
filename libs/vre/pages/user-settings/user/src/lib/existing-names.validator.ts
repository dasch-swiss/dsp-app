import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { first, map } from 'rxjs/operators';

/**
 * validation of existing name values. Array method (list of values)
 * Use it in a "formbuilder" group as a validator property
 *
 * @param {RegExp} valArrayRegexp List of regular expression values
 * @returns ValidatorFn
 */
export function existingNamesValidator(valArrayRegexp: RegExp[], isCaseSensitive = false): ValidatorFn {
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

export function existingNamesAsyncValidator(
  regexObservable: Observable<RegExp[]>,
  isCaseSensitive = false
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null); // consider valid
    }

    const name = isCaseSensitive ? control.value : control.value.toLowerCase();

    return regexObservable.pipe(
      first(), // Take the first emission of the observable and complete
      map(regexArray => {
        // Check if the control value matches any of the regex patterns
        const isInvalid = regexArray.some(regex => regex.test(name));
        return isInvalid ? { existingName: { name } } : null;
      })
    );
  };
}
