import { Injectable } from '@angular/core';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectShortnameService {
  private _cache = new Map<string, Observable<string>>();

  constructor(private readonly _adminApiService: AdminAPIApiService) {}

  getProjectShortname(projectIri: string): Observable<string> {
    if (!this._cache.has(projectIri)) {
      const shortname$ = this._adminApiService.getAdminProjectsIriProjectiri(projectIri).pipe(
        map(response => response.project.shortname as unknown as string),
        catchError(error => {
          // Log for debugging but don't break the UI
          console.warn(`Failed to fetch project shortname for ${projectIri}:`, error);
          return of(''); // Empty string hides the shortname display
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this._cache.set(projectIri, shortname$);
    }
    return this._cache.get(projectIri)!;
  }
}
