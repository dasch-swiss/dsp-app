import { Injectable } from '@angular/core';
import { AdminAPIApiService, ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { EMPTY, expand, map, reduce } from 'rxjs';

/**
 * Body for setting the project's resource-side (data) legal info.
 * Mirrors the dsp-api `PUT /admin/projects/{shortcode}/legal-info/resource-side` request.
 * TODO(verify-after-regen): once `npm run update-openapi` regenerates the client, prefer the
 * generated request DTO over this local interface.
 */
export interface ResourceSideLegalInfoUpdate {
  dataLicense: string | null;
  dataCopyrightHolder: string | null;
  dataAuthorship: string[];
}

@Injectable({ providedIn: 'root' })
export class PaginatedApiService {
  constructor(private readonly _adminApiService: AdminAPIApiService) {}

  /**
   * Set the project's resource-side (data) legal info (license, copyright holder, default authorship).
   * TODO(verify-after-regen): confirm the generated method name after `npm run update-openapi`.
   * Expected from the OpenAPI generator: `putAdminProjectsShortcodeProjectshortcodeLegalInfoResourceSide`.
   */
  updateResourceSideLegalInfo(projectShortcode: string, body: ResourceSideLegalInfoUpdate) {
    return this._adminApiService.putAdminProjectsShortcodeProjectshortcodeLegalInfoResourceSide(projectShortcode, body);
  }

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
