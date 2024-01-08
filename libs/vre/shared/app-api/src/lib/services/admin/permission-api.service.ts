import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  AdministrativePermissionResponse,
  CreateDefaultObjectAccessPermission,
  DefaultObjectAccessPermissionResponse,
  DefaultObjectAccessPermissionsResponse,
  ProjectPermissionsResponse,
  UpdateAdministrativePermission,
  UpdateAdministrativePermissionGroup,
  UpdateDefaultObjectAccessPermission,
  UpdateDefaultObjectAccessPermissionProperty,
  UpdateDefaultObjectAccessPermissionResourceClass,
} from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { BaseApi } from '../base-api';

@Injectable({ providedIn: 'root' })
export class PermissionApiService extends BaseApi {
  constructor(
    private _http: HttpClient,
    private _appConfig: AppConfigService
  ) {
    super('admin/permissions', _appConfig.dspApiConfig);
  }

  getProjectPermissions(projectIri: string) {
    return this._http.get<ProjectPermissionsResponse>(`${this.baseUri}/${encodeURIComponent(projectIri)}`);
  }

  updateAdministrativePermission(permissionIri: string, permisssion: UpdateAdministrativePermission) {
    // TODO from name, it should be in admin-permission-api.service.ts, but from route it is in the right place.
    return this._http.put<AdministrativePermissionResponse>(
      `${this.baseUri}/${encodeURIComponent(permissionIri)}/hasPermissions`,
      permisssion
    );
  }

  updateAdministrativePermissionGroup(permissionIri: string, updatedGroup: UpdateAdministrativePermissionGroup) {
    // TODO from name, it should be in admin-permission-api.service.ts, but from route it is in the right place.
    return this._http.put<AdministrativePermissionResponse>(
      `${this.baseUri}/${encodeURIComponent(permissionIri)}/group`,
      updatedGroup
    );
  }

  getDefaultObjectAccessPermissions(projectIri: string) {
    return this._http.get<DefaultObjectAccessPermissionsResponse>(
      `${this.baseUri}/doap/${encodeURIComponent(projectIri)}`
    );
  }

  createDefaultObjectAccessPermission(defaultObject: CreateDefaultObjectAccessPermission) {
    // A default object access permission must
    // always reference a project
    if (!defaultObject.forProject) {
      throw new Error('Project is required when creating a new default object access permission.');
    }

    if (defaultObject.hasPermissions.length === 0) {
      throw new Error('At least one permission is expected.');
    }

    /*
            A default object access permission can only reference either a group, a resource class, a property,
            or a combination of resource class and property.
         */
    if (
      ((defaultObject.forGroup &&
        !defaultObject.forResourceClass &&
        (!defaultObject.forProperty || !defaultObject.forGroup) &&
        defaultObject.forResourceClass &&
        (!defaultObject.forProperty || !defaultObject.forGroup) &&
        !defaultObject.forResourceClass &&
        defaultObject.forProperty) ||
        !defaultObject.forGroup) &&
      defaultObject.forResourceClass &&
      defaultObject.forProperty
    ) {
      return this._http.post<DefaultObjectAccessPermissionResponse>(`${this.baseUri}/doap`, defaultObject);
    } else {
      throw new Error('Invalid combination of properties for creation of new default object access permission.');
    }
  }

  updateDefaultObjectAccessPermission(permissionIri: string, permission: UpdateDefaultObjectAccessPermission) {
    // TODO route should be replaced by /doap
    return this._http.put<DefaultObjectAccessPermissionResponse>(
      `${this.baseUri}/${encodeURIComponent(permissionIri)}/hasPermissions`,
      permission
    );
  }

  updateDefaultObjectAccessPermissionGroup(permissionIri: string, permission: UpdateDefaultObjectAccessPermission) {
    // TODO route should be replaced by /doap
    return this._http.put<DefaultObjectAccessPermissionResponse>(
      `${this.baseUri}/${encodeURIComponent(permissionIri)}/group`,
      permission
    );
  }

  updateDefaultObjectAccessPermissionResourceClass(
    permissionIri: string,
    permission: UpdateDefaultObjectAccessPermissionResourceClass
  ) {
    // TODO route should be replaced by /doap
    return this._http.put<DefaultObjectAccessPermissionResponse>(
      `${this.baseUri}/${encodeURIComponent(permissionIri)}/resourceClass`,
      permission
    );
  }

  updateDefaultObjectAccessPermissionProperty(
    permissionIri: string,
    permission: UpdateDefaultObjectAccessPermissionProperty
  ) {
    // TODO route should be replaced by /doap
    return this._http.put<DefaultObjectAccessPermissionResponse>(
      `${this.baseUri}/${encodeURIComponent(permissionIri)}/property`,
      permission
    );
  }

  delete(permissionIri: string) {
    return this._http.delete(this._permissionRoute(permissionIri));
  }

  private _permissionRoute(permissionIri: string) {
    return `${this.baseUri}/${encodeURIComponent(permissionIri)}`;
  }
}
