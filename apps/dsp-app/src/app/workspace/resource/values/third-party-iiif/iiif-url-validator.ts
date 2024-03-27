import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IIIFUrl } from './third-party-iiif';

export function iiifUrlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!IIIFUrl.createUrl(control.value)?.isValidIiifUrl) {
      return { invalidIiifUrl: true };
    }
    return null;
  };
}

function fetchUrl(url: string): Promise<void> {
  return fetch(url, { method: 'HEAD' }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
  });
}

export function infoJsonUrlValidatorAsync(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const iiifUrl = IIIFUrl.createUrl(control.value);
    if (!iiifUrl) {
      return of(null);
    }

    return from(fetchUrl(iiifUrl.infoJsonUrl)).pipe(
      map(() => null),
      catchError(() => of({ infoJsonError: true }))
    );
  };
}

export function previewImageUrlValidatorAsync(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const iiifUrl = IIIFUrl.createUrl(control.value);
    if (!iiifUrl) {
      return of(null);
    }

    return from(fetchUrl(iiifUrl?.previewImageUrl)).pipe(
      map(() => null),
      catchError(() => of({ previewImageError: true }))
    );
  };
}
