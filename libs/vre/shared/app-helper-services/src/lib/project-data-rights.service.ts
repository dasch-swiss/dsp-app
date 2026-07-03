import { Injectable } from '@angular/core';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { LegalInfoApiService, ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import {
  AdminAPIApiService,
  ProjectLicenseDto,
  ResourceSideLegalInfo,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
import { catchError, map, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';

export interface ProjectDataRights {
  copyrightHolder?: string;
  authorship: string[];
  licenseLabel?: string;
  licenseUrl?: string;
}

/**
 * Resolves a project's data-side legal info (license label + deed URL, copyright holder,
 * default authorship) into the display-shape used by the Resource Rights Statement viewer,
 * project card, and create-resource form.
 *
 * Cache scope: per project session. `ProjectPageGuard` calls `clearAll()` on every entry into
 * `/project/:uuid`, so switching to a different project (or re-entering after leaving the
 * project scope) starts with fresh data. Mutation methods on this service call
 * `invalidateByShortcode` via `tap` on success.
 *
 * Security invariant: this cache is root-scoped and mutable. Cross-user isolation currently
 * relies on `AuthService.logout()` calling `window.location.reload()` (which destroys the
 * singleton). If that changes, this service must subscribe to identity changes and call
 * `clearAll()` on user switch.
 */
@Injectable({ providedIn: 'root' })
export class ProjectDataRightsService {
  private readonly _licensesByShortcode = new Map<string, Observable<ProjectLicenseDto[]>>();
  private readonly _projectByIri = new Map<string, Observable<ReadProject>>();
  /** Reverse index used by invalidateByShortcode to evict the matching project entry precisely. */
  private readonly _iriByShortcode = new Map<string, string>();

  constructor(
    private readonly _adminApi: AdminAPIApiService,
    private readonly _projectApi: ProjectApiService,
    private readonly _legalInfoApi: LegalInfoApiService
  ) {}

  forProject(projectIri: string): Observable<ProjectDataRights> {
    return this._cachedProject(projectIri).pipe(switchMap(project => this._resolve(project)));
  }

  fromProject(project: ReadProject): Observable<ProjectDataRights> {
    return this._resolve(project);
  }

  /** Persist the project's data-side legal info; invalidates the shortcode's cache on success. */
  updateResourceSideLegalInfo(shortcode: string, body: ResourceSideLegalInfo): Observable<ResourceSideLegalInfo> {
    return this._adminApi
      .putAdminProjectsShortcodeProjectshortcodeLegalInfoResource(shortcode, body)
      .pipe(tap(() => this.invalidateByShortcode(shortcode)));
  }

  enableLicense(shortcode: string, licenseIri: string): Observable<unknown> {
    return this._adminApi
      .putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriEnable(shortcode, licenseIri)
      .pipe(tap(() => this.invalidateByShortcode(shortcode)));
  }

  disableLicense(shortcode: string, licenseIri: string): Observable<unknown> {
    return this._adminApi
      .putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriDisable(shortcode, licenseIri)
      .pipe(tap(() => this.invalidateByShortcode(shortcode)));
  }

  invalidateByShortcode(shortcode: string): void {
    this._licensesByShortcode.delete(shortcode);
    const iri = this._iriByShortcode.get(shortcode);
    if (iri) {
      this._projectByIri.delete(iri);
      this._iriByShortcode.delete(shortcode);
    }
  }

  clearAll(): void {
    this._licensesByShortcode.clear();
    this._projectByIri.clear();
    this._iriByShortcode.clear();
  }

  private _resolve(project: ReadProject): Observable<ProjectDataRights> {
    const base: ProjectDataRights = {
      copyrightHolder: project.dataCopyrightHolder,
      authorship: project.dataAuthorship ?? [],
    };
    if (!project.dataLicense) {
      return of(base);
    }
    return this._cachedLicenses(project.shortcode).pipe(
      map(licenses => {
        const license = licenses.find(l => l.id === project.dataLicense);
        return { ...base, licenseLabel: license?.labelEn, licenseUrl: license?.uri };
      })
    );
  }

  private _cachedProject(iri: string): Observable<ReadProject> {
    let cached = this._projectByIri.get(iri);
    if (!cached) {
      cached = this._projectApi.get(iri).pipe(
        map(response => response.project),
        tap(project => this._iriByShortcode.set(project.shortcode, iri)),
        // Evict on error so the next subscriber gets a fresh attempt instead of a replayed failure.
        catchError(err => {
          this._projectByIri.delete(iri);
          return throwError(() => err);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
      this._projectByIri.set(iri, cached);
    }
    return cached;
  }

  private _cachedLicenses(shortcode: string): Observable<ProjectLicenseDto[]> {
    let cached = this._licensesByShortcode.get(shortcode);
    if (!cached) {
      cached = this._legalInfoApi.getLicenses(shortcode).pipe(
        catchError(err => {
          this._licensesByShortcode.delete(shortcode);
          return throwError(() => err);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
      this._licensesByShortcode.set(shortcode, cached);
    }
    return cached;
  }
}
