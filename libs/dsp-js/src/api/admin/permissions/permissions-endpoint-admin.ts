import { catchError, map } from 'rxjs';
import { AdministrativePermissionResponse } from '../../../models/admin/administrative-permission-response';
import { AdministrativePermissionsResponse } from '../../../models/admin/administrative-permissions-response';
import { CreateAdministrativePermission } from '../../../models/admin/create-administrative-permission';
import { CreateDefaultObjectAccessPermission } from '../../../models/admin/create-default-object-access-permission';
import { DefaultObjectAccessPermissionResponse } from '../../../models/admin/default-object-access-permission-response';
import { DefaultObjectAccessPermissionsResponse } from '../../../models/admin/default-object-access-permissions-response';
import { DeletePermissionResponse } from '../../../models/admin/delete-permission-response';
import { ProjectPermissionsResponse } from '../../../models/admin/project-permissions-response';
import { UpdateAdministrativePermission } from '../../../models/admin/update-administrative-permission';
import { UpdateAdministrativePermissionGroup } from '../../../models/admin/update-administrative-permission-group';
import { UpdateDefaultObjectAccessPermission } from '../../../models/admin/update-default-object-access-permission';
import { UpdateDefaultObjectAccessPermissionProperty } from '../../../models/admin/update-default-object-access-permission-property';
import { UpdateDefaultObjectAccessPermissionResourceClass } from '../../../models/admin/update-default-object-access-permission-resource-class';
import { ApiResponseData } from '../../../models/api-response-data';
import { Endpoint } from '../../endpoint';

/**
 * An endpoint for working with Knora permissions.
 * @deprecated Use open API docs instead
 * @category Endpoint Admin
 */
export class PermissionsEndpointAdmin extends Endpoint {
  /**
   * Gets the permissions for a project.
   *
   * @param projectIri The project IRI.
   */
  getProjectPermissions(projectIri: string) {
    return this.httpGet('/' + encodeURIComponent(projectIri)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ProjectPermissionsResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets the administrative permissions for a project.
   *
   * @param projectIri The project IRI.
   */
  getAdministrativePermissions(projectIri: string) {
    return this.httpGet('/ap/' + encodeURIComponent(projectIri)).pipe(
      map(ajaxResponse =>
        ApiResponseData.fromAjaxResponse(ajaxResponse, AdministrativePermissionsResponse, this.jsonConvert)
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets the administrative permission for a project and group.
   *
   * @param projectIri The project IRI.
   * @param groupIri The group IRI.
   */
  getAdministrativePermission(projectIri: string, groupIri: string) {
    return this.httpGet('/ap/' + encodeURIComponent(projectIri) + '/' + encodeURIComponent(groupIri)).pipe(
      map(ajaxResponse =>
        ApiResponseData.fromAjaxResponse(ajaxResponse, AdministrativePermissionResponse, this.jsonConvert)
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Creates an administrative permission.
   *
   * @param administrativePermission the administrative permission to be created.
   */
  createAdministrativePermission(administrativePermission: CreateAdministrativePermission) {
    if (!administrativePermission.forGroup || !administrativePermission.forProject) {
      throw new Error('Group and project are required when creating a new administrative permission.');
    }

    if (administrativePermission.hasPermissions.length === 0) {
      throw new Error('At least one permission is expected.');
    }

    return this.httpPost('/ap', this.jsonConvert.serializeObject(administrativePermission)).pipe(
      map(ajaxResponse =>
        ApiResponseData.fromAjaxResponse(ajaxResponse, AdministrativePermissionResponse, this.jsonConvert)
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates an existing administrative permission.
   *
   * @param permissionIri the Iri of the permission to be updated.
   * @param administrativePermission the new permission settings.
   */
  updateAdministrativePermission(permissionIri: string, administrativePermission: UpdateAdministrativePermission) {
    return this.httpPut(
      '/' + encodeURIComponent(permissionIri) + '/hasPermissions',
      this.jsonConvert.serializeObject(administrativePermission)
    ).pipe(
      map(ajaxResponse =>
        ApiResponseData.fromAjaxResponse(ajaxResponse, AdministrativePermissionResponse, this.jsonConvert)
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates an existing administrative permission's group.
   *
   * @param permissionIri the Iri of the permission to be updated.
   * @param updateAdministrativePermissionGroup the new group setting.
   */
  updateAdministrativePermissionGroup(
    permissionIri: string,
    updateAdministrativePermissionGroup: UpdateAdministrativePermissionGroup
  ) {
    return this.httpPut(
      '/' + encodeURIComponent(permissionIri) + '/group',
      this.jsonConvert.serializeObject(updateAdministrativePermissionGroup)
    ).pipe(
      map(ajaxResponse =>
        ApiResponseData.fromAjaxResponse(ajaxResponse, AdministrativePermissionResponse, this.jsonConvert)
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets all default object access permissions for a project.
   *
   * @param projectIri The project IRI.
   */
  getDefaultObjectAccessPermissions(projectIri: string) {
    return this.httpGet('/doap/' + encodeURIComponent(projectIri)).pipe(
      map(ajaxResponse =>
        ApiResponseData.fromAjaxResponse(ajaxResponse, DefaultObjectAccessPermissionsResponse, this.jsonConvert)
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Creates a default object access permission.
   *
   * @param defaultObjectAccessPermission the permission to be created.
   */
  createDefaultObjectAccessPermission(defaultObjectAccessPermission: CreateDefaultObjectAccessPermission) {
    // A default object access permission must
    // always reference a project
    if (!defaultObjectAccessPermission.forProject) {
      throw new Error('Project is required when creating a new default object access permission.');
    }

    if (defaultObjectAccessPermission.hasPermissions.length === 0) {
      throw new Error('At least one permission is expected.');
    }

    /*
            A default object access permission can only reference either a group, a resource class, a property,
            or a combination of resource class and property.
         */
    if (
      (defaultObjectAccessPermission.forGroup &&
        !defaultObjectAccessPermission.forResourceClass &&
        !defaultObjectAccessPermission.forProperty) ||
      (!defaultObjectAccessPermission.forGroup &&
        defaultObjectAccessPermission.forResourceClass &&
        !defaultObjectAccessPermission.forProperty) ||
      (!defaultObjectAccessPermission.forGroup &&
        !defaultObjectAccessPermission.forResourceClass &&
        defaultObjectAccessPermission.forProperty) ||
      (!defaultObjectAccessPermission.forGroup &&
        defaultObjectAccessPermission.forResourceClass &&
        defaultObjectAccessPermission.forProperty)
    ) {
      return this.httpPost('/doap', this.jsonConvert.serializeObject(defaultObjectAccessPermission)).pipe(
        map(ajaxResponse =>
          ApiResponseData.fromAjaxResponse(ajaxResponse, DefaultObjectAccessPermissionResponse, this.jsonConvert)
        ),
        catchError(error => this.handleError(error))
      );
    } else {
      throw new Error('Invalid combination of properties for creation of new default object access permission.');
    }
  }

  /**
   * Updates an existing default object access permission.
   *
   * @param permissionIri the Iri of the permission to be updated.
   * @param defaultObjectAccessPermission the new permission settings.
   */
  updateDefaultObjectAccessPermission(
    permissionIri: string,
    defaultObjectAccessPermission: UpdateDefaultObjectAccessPermission
  ) {
    return this.httpPut(
      '/' + encodeURIComponent(permissionIri) + '/hasPermissions',
      this.jsonConvert.serializeObject(defaultObjectAccessPermission)
    ).pipe(
      map(ajaxResponse =>
        ApiResponseData.fromAjaxResponse(ajaxResponse, DefaultObjectAccessPermissionResponse, this.jsonConvert)
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates an existing default object access permission's group.
   *
   * @param permissionIri the Iri of the permission to be updated.
   * @param administrativePermission the new permission settings.
   */
  updateDefaultObjectAccessPermissionGroup(
    permissionIri: string,
    administrativePermission: UpdateAdministrativePermissionGroup
  ) {
    return this.httpPut(
      '/' + encodeURIComponent(permissionIri) + '/group',
      this.jsonConvert.serializeObject(administrativePermission)
    ).pipe(
      map(ajaxResponse =>
        ApiResponseData.fromAjaxResponse(ajaxResponse, DefaultObjectAccessPermissionResponse, this.jsonConvert)
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates an existing default object access permission's resource class.
   *
   * @param permissionIri the Iri of the permission to be updated.
   * @param administrativePermission the new permission settings.
   */
  updateDefaultObjectAccessPermissionResourceClass(
    permissionIri: string,
    administrativePermission: UpdateDefaultObjectAccessPermissionResourceClass
  ) {
    return this.httpPut(
      '/' + encodeURIComponent(permissionIri) + '/resourceClass',
      this.jsonConvert.serializeObject(administrativePermission)
    ).pipe(
      map(ajaxResponse =>
        ApiResponseData.fromAjaxResponse(ajaxResponse, DefaultObjectAccessPermissionResponse, this.jsonConvert)
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates an existing default object access permission's property.
   *
   * @param permissionIri the Iri of the permission to be updated.
   * @param administrativePermission the new permission settings.
   */
  updateDefaultObjectAccessPermissionProperty(
    permissionIri: string,
    administrativePermission: UpdateDefaultObjectAccessPermissionProperty
  ) {
    return this.httpPut(
      '/' + encodeURIComponent(permissionIri) + '/property',
      this.jsonConvert.serializeObject(administrativePermission)
    ).pipe(
      map(ajaxResponse =>
        ApiResponseData.fromAjaxResponse(ajaxResponse, DefaultObjectAccessPermissionResponse, this.jsonConvert)
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Deletes a permission.
   *
   * @param permissionIri the IRI of the permission to be deleted.
   */
  deletePermission(permissionIri: string) {
    return this.httpDelete('/' + encodeURIComponent(permissionIri)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, DeletePermissionResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }
}
