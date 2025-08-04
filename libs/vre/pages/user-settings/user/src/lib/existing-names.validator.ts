import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { first, map, Observable, of } from 'rxjs';

export function existingNamesValidator(existingNames: string[], isCaseSensitive = false): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;

    const name = isCaseSensitive ? control.value : control.value.toLowerCase();
    const normalized = isCaseSensitive ? existingNames : existingNames.map(n => n.toLowerCase());

    return normalized.includes(name) ? { existingName: { name } } : null;
  };
}

export function existingNamesAsyncValidator(
  existingNames$: Observable<string[]>,
  isCaseSensitive = false
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) return of(null);

    const name = isCaseSensitive ? control.value : control.value.toLowerCase();

    return existingNames$.pipe(
      first(),
      map(names => (names.includes(name) ? { existingName: { name } } : null))
    );
  };
}
