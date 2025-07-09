import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { catchError, from, map, Observable, of } from 'rxjs';
import { IIIFUrl } from './third-party-iiif';

export function iiifUrlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!IIIFUrl.createUrl(control.value)?.isValidIiifUrl) {
      return { invalidIiifUrl: true };
    }
    return null;
  };
}

export function isExternalHostValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const url = IIIFUrl.createUrl(control.value);
    if (url && !url.isExternalHost) {
      return { invalidHost: true };
    }
    return null;
  };
}

async function fetchUrl(url: string): Promise<void> {
  const response = await fetch(url, { method: 'HEAD' });
  if (!response.ok) {
    const r = await fetch(url); // Some servers don't support HEAD requests
    if (!r.ok) {
      throw new Error(`HTTP Error: ${r.status}`);
    }
  }
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

    return from(fetchUrl(iiifUrl.previewImageUrl)).pipe(
      map(() => null),
      catchError(() => of({ previewImageError: true }))
    );
  };
}
