import { Injectable } from '@angular/core';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService, ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { PaginatedApiService } from './paginated-api.service';

export interface ProjectDataRights {
  copyrightHolder?: string;
  authorship: string[];
  licenseLabel?: string;
  licenseUrl?: string;
}

/** Structural subset of the fields needed to resolve rights — accepts either dsp-js ReadProject or the generated admin Project. */
interface ProjectDataRightsSource {
  shortcode: string;
  dataLicense?: string;
  dataCopyrightHolder?: string;
  dataAuthorship?: string[];
}

/**
 * Resolves a project's data-side legal info (license label + deed URL, copyright holder,
 * default authorship) into the display-shape used by the Resource Rights Statement viewer,
 * project card, and create-resource form.
 *
 * Cache scope: per project session. `ProjectPageGuard` calls `clearAll()` on every entry into
 * `/project/:uuid`, so switching to a different project (or re-entering after leaving the
 * project scope) starts with fresh data. Mutating endpoints
 * (`updateResourceSideLegalInfo`, `enableLicense`, `disableLicense`) call
 * `invalidateByShortcode` via `PaginatedApiService`.
 */
@Injectable({ providedIn: 'root' })
export class ProjectDataRightsService {
  private readonly _licensesByShortcode = new Map<string, Observable<ProjectLicenseDto[]>>();
  private readonly _projectByIri = new Map<string, Observable<ReadProject>>();

  constructor(
    private readonly _adminApi: AdminAPIApiService,
    private readonly _projectApi: ProjectApiService,
    private readonly _paginatedApi: PaginatedApiService
  ) {}

  forProject(projectIri: string): Observable<ProjectDataRights> {
    return this._cachedProject(projectIri).pipe(switchMap(project => this._resolve(project)));
  }

  forShortcode(shortcode: string): Observable<ProjectDataRights> {
    return this._adminApi.getAdminProjectsShortcodeProjectshortcode(shortcode).pipe(
      switchMap(response =>
        this._resolve({
          shortcode: response.project.shortcode.value,
          dataLicense: response.project.dataLicense,
          dataCopyrightHolder: response.project.dataCopyrightHolder,
          dataAuthorship: response.project.dataAuthorship,
        })
      )
    );
  }

  fromProject(project: ProjectDataRightsSource): Observable<ProjectDataRights> {
    return this._resolve(project);
  }

  invalidateByShortcode(shortcode: string): void {
    this._licensesByShortcode.delete(shortcode);
    for (const iri of Array.from(this._projectByIri.keys())) {
      this._projectByIri.delete(iri);
    }
  }

  clearAll(): void {
    this._licensesByShortcode.clear();
    this._projectByIri.clear();
  }

  private _resolve(project: ProjectDataRightsSource): Observable<ProjectDataRights> {
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
        shareReplay({ bufferSize: 1, refCount: false })
      );
      this._projectByIri.set(iri, cached);
    }
    return cached;
  }

  private _cachedLicenses(shortcode: string): Observable<ProjectLicenseDto[]> {
    let cached = this._licensesByShortcode.get(shortcode);
    if (!cached) {
      cached = this._paginatedApi.getLicenses(shortcode).pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this._licensesByShortcode.set(shortcode, cached);
    }
    return cached;
  }
}
