import { catchError, map } from 'rxjs';

import { ApiResponseData } from '../../../models/api-response-data';
import { Endpoint } from '../../endpoint';

import { GroupsResponse } from '../../../models/admin/groups-response';
import { ProjectsResponse } from '../../../models/admin/projects-response';
import { UpdateUserRequest } from '../../../models/admin/update-user-request';
import { User } from '../../../models/admin/user';
import { UserResponse } from '../../../models/admin/user-response';
import { UsersResponse } from '../../../models/admin/users-response';

/**
 * An endpoint for working with Knora users.
 * @deprecated Use open API docs instead
 * @category Endpoint Admin
 */
export class UsersEndpointAdmin extends Endpoint {
  /**
   * Returns a list of all users.
   */
  getUsers() {
    return this.httpGet('').pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UsersResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets a user by a property.
   *
   * @param property The name of the property by which the user is identified.
   * @param value The value of the property by which the user is identified.
   */
  getUser(property: 'iri' | 'email' | 'username', value: string) {
    return this.httpGet('/' + encodeURIComponent(property) + '/' + encodeURIComponent(value)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UserResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets a user by IRI.
   *
   * @param iri The IRI of the user.
   */
  getUserByIri(iri: string) {
    return this.getUser('iri', iri);
  }

  /**
   * Gets a user by email address.
   *
   * @param email The email address of the user.
   */
  getUserByEmail(email: string) {
    return this.getUser('email', email);
  }

  /**
   * Gets a user by username.
   *
   * @param username The username of the user.
   */
  getUserByUsername(username: string) {
    return this.getUser('username', username);
  }

  /**
   * Gets a user's group memberships.
   *
   * @param iri The user's IRI.
   */
  getUserGroupMemberships(iri: string) {
    return this.httpGet('/iri/' + encodeURIComponent(iri) + '/group-memberships').pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, GroupsResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets a user's project memberships.
   *
   * @param iri The IRI of the user.
   */
  getUserProjectMemberships(iri: string) {
    return this.httpGet('/iri/' + encodeURIComponent(iri) + '/project-memberships').pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ProjectsResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets a user's project admin memberships.
   *
   * @param iri The user's IRI.
   */
  getUserProjectAdminMemberships(iri: string) {
    return this.httpGet('/iri/' + encodeURIComponent(iri) + '/project-admin-memberships').pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ProjectsResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Creates a user.
   *
   * @param user The user to be created.
   */
  createUser(user: User) {
    return this.httpPost('', this.jsonConvert.serializeObject(user)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UserResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates an existing user's basic information.
   *
   * @param iri The IRI of the user to be updated.
   * @param userInfo The user information to be updated.
   */
  updateUserBasicInformation(iri: string, userInfo: UpdateUserRequest) {
    return this.httpPut(
      '/iri/' + encodeURIComponent(iri) + '/BasicUserInformation',
      this.jsonConvert.serializeObject(userInfo)
    ).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UserResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates a user's status.
   *
   * @param iri The user's IRI.
   * @param status The user's new status.
   */
  updateUserStatus(iri: string, status: boolean) {
    return this.httpPut('/iri/' + encodeURIComponent(iri) + '/Status', { status: status }).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UserResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates a user's password.
   *
   * @param iri The IRI of the user to be updated.
   * @param requesterPassword The requesting user's current password.
   * @param newPassword The specified user's new password.
   */
  updateUserPassword(iri: string, requesterPassword: string, newPassword: string) {
    return this.httpPut('/iri/' + encodeURIComponent(iri) + '/Password', {
      requesterPassword: requesterPassword,
      newPassword: newPassword,
    }).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UserResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Adds a user to a group.
   *
   * @param userIri The IRI of the user.
   * @param groupIri The IRI of the group.
   */
  addUserToGroupMembership(userIri: string, groupIri: string) {
    return this.httpPost(
      '/iri/' + encodeURIComponent(userIri) + '/group-memberships/' + encodeURIComponent(groupIri)
    ).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UserResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Removes a user from a project.
   *
   * @param userIri The IRI of the user.
   * @param groupIri The IRI of the group.
   */
  removeUserFromGroupMembership(userIri: string, groupIri: string) {
    return this.httpDelete(
      '/iri/' + encodeURIComponent(userIri) + '/group-memberships/' + encodeURIComponent(groupIri)
    ).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UserResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Adds a user to a project.
   *
   * @param userIri The user's IRI.
   * @param projectIri The project's IRI.
   */
  addUserToProjectMembership(userIri: string, projectIri: string) {
    return this.httpPost(
      '/iri/' + encodeURIComponent(userIri) + '/project-memberships/' + encodeURIComponent(projectIri)
    ).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UserResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Removes a user from a project.
   *
   * @param userIri The user's IRI.
   * @param projectIri The project's IRI.
   */
  removeUserFromProjectMembership(userIri: string, projectIri: string) {
    return this.httpDelete(
      '/iri/' + encodeURIComponent(userIri) + '/project-memberships/' + encodeURIComponent(projectIri)
    ).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UserResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Makes a user a project administrator.
   *
   * @param userIri The IRI of the user.
   * @param projectIri The IRI of the project.
   */
  addUserToProjectAdminMembership(userIri: string, projectIri: string) {
    return this.httpPost(
      '/iri/' + encodeURIComponent(userIri) + '/project-admin-memberships/' + encodeURIComponent(projectIri)
    ).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UserResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Removes a user's project administrator status.
   *
   * @param userIri The IRI of the user.
   * @param projectIri The IRI of the project.
   */
  removeUserFromProjectAdminMembership(userIri: string, projectIri: string) {
    return this.httpDelete(
      '/iri/' + encodeURIComponent(userIri) + '/project-admin-memberships/' + encodeURIComponent(projectIri)
    ).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UserResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates a user's SystemAdmin membership.
   *
   * @param iri The IRI of the user to be updated.
   * @param systemAdmin True if the user should be a system admin
   */
  updateUserSystemAdminMembership(iri: string, systemAdmin: boolean) {
    return this.httpPut('/iri/' + encodeURIComponent(iri) + '/SystemAdmin', { systemAdmin: systemAdmin }).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UserResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Deletes a user. This method does not actually delete a user, but sets the status to false.
   *
   * @param iri The IRI of the user to be deleted.
   */
  deleteUser(iri: string) {
    return this.httpDelete('/iri/' + encodeURIComponent(iri)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, UserResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }
}
