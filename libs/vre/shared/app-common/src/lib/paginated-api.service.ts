import { Injectable, inject } from '@angular/core';
import {
  AdminAPIApiService,
  ProjectLicenseDto,
  ResourceSideLegalInfo,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
import { EMPTY, expand, map, reduce, tap } from 'rxjs';
import { ProjectDataRightsService } from './project-data-rights.service';

@Injectable({ providedIn: 'root' })
export class PaginatedApiService {
  private readonly _dataRights = inject(ProjectDataRightsService);

  constructor(private readonly _adminApiService: AdminAPIApiService) {}

  updateResourceSideLegalInfo(projectShortcode: string, body: ResourceSideLegalInfo) {
    return this._adminApiService
      .putAdminProjectsShortcodeProjectshortcodeLegalInfoResource(projectShortcode, body)
      .pipe(tap(() => this._dataRights.invalidateByShortcode(projectShortcode)));
  }

  enableLicense(projectShortcode: string, licenseIri: string) {
    return this._adminApiService
      .putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriEnable(projectShortcode, licenseIri)
      .pipe(tap(() => this._dataRights.invalidateByShortcode(projectShortcode)));
  }

  disableLicense(projectShortcode: string, licenseIri: string) {
    return this._adminApiService
      .putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriDisable(projectShortcode, licenseIri)
      .pipe(tap(() => this._dataRights.invalidateByShortcode(projectShortcode)));
  }

  getLicenses(projectShortcode: string, pageSize = 100) {
    return this._adminApiService
      .getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses(projectShortcode, 1, pageSize)
      .pipe(
        expand(response => {
          if (response.pagination.currentPage < response.pagination.totalPages) {
            return this._adminApiService.getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses(
              projectShortcode,
              response.pagination.currentPage + 1,
              pageSize
            );
          } else {
            return EMPTY;
          }
        }),
        map(data => data.data),
        reduce((acc, data) => acc.concat(data), [] as ProjectLicenseDto[])
      );
  }

  getCopyrightHolders(projectShortcode: string, pageSize = 100) {
    return this._adminApiService
      .getAdminProjectsShortcodeProjectshortcodeLegalInfoCopyrightHolders(projectShortcode, 1, pageSize)
      .pipe(
        expand(response => {
          if (response.pagination.currentPage < response.pagination.totalPages) {
            return this._adminApiService.getAdminProjectsShortcodeProjectshortcodeLegalInfoCopyrightHolders(
              projectShortcode,
              response.pagination.currentPage + 1,
              pageSize
            );
          } else {
            return EMPTY;
          }
        }),
        map(data => data.data),
        reduce((acc, data) => acc.concat(data), [] as string[])
      );
  }

  getAuthorships(projectShortcode: string, pageSize = 100) {
    return this._adminApiService
      .getAdminProjectsShortcodeProjectshortcodeLegalInfoAuthorships(projectShortcode, 1, pageSize)
      .pipe(
        expand(response => {
          if (response.pagination.currentPage < response.pagination.totalPages) {
            return this._adminApiService.getAdminProjectsShortcodeProjectshortcodeLegalInfoAuthorships(
              projectShortcode,
              response.pagination.currentPage + 1,
              pageSize
            );
          } else {
            return EMPTY;
          }
        }),
        map(data => data.data),
        reduce((acc, data) => acc.concat(data), [] as string[])
      );
  }
}
