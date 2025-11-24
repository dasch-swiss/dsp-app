import { Injectable } from '@angular/core';
import { AdminAPIApiService, ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { EMPTY, expand, map, reduce } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaginatedApiService {
  constructor(private readonly _adminApiService: AdminAPIApiService) {}

  getLicenses(projectShortcode: string, pageSize = 100) {
    return this._adminApiService.getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses(projectShortcode).pipe(
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
