import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { first, map, Observable, of } from 'rxjs';

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
