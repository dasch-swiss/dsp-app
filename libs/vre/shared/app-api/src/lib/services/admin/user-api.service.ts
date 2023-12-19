import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  GroupsResponse,
  ProjectsResponse,
  UpdateUserRequest,
  User,
  UserResponse,
  UsersResponse,
} from '@dasch-swiss/dsp-js';
import { BaseApi } from '../base-api';

export type UserIdentifier = 'iri' | 'email' | 'username';

@Injectable({
  providedIn: 'root',
})
export class UserApiService extends BaseApi {
  constructor(private _http: HttpClient) {
    super('admin/users');
  }

  list() {
    return this._http.get<UsersResponse>(this.baseUri);
  }

  get(id: string, idType: UserIdentifier = 'iri') {
    return this._http.get<UserResponse>(this._userRoute(id, idType));
  }

  create(user: User) {
    return this._http.post<UserResponse>(this.baseUri, user);
  }

  delete(id: string) {
    return this._http.delete<UserResponse>(this._userRoute(id));
  }

  getGroupMembershipsForUser(iri: string) {
    return this._http.get<GroupsResponse>(
      `${this._userRoute(iri)}/group-memberships`
    );
  }

  getProjectMembershipsForUser(iri: string) {
    return this._http.get<ProjectsResponse>(
      `${this._userRoute(iri)}/project-memberships`
    );
  }

  getProjectAdminMembershipsForUser(iri: string) {
    return this._http.get<ProjectsResponse>(
      `${this._userRoute(iri)}/project-admin-memberships`
    );
  }

  updateBasicInformation(iri: string, updatedUser: UpdateUserRequest) {
    return this._http.put<UserResponse>(
      `${this._userRoute(iri)}/BasicUserInformation`,
      updatedUser
    );
  }

  updateStatus(iri: string, status: boolean) {
    return this._http.put<UserResponse>(`${this._userRoute(iri)}/Status`, {
      status,
    });
  }

  updatePassword(iri: string, currentPassword: boolean, newPassword: boolean) {
    return this._http.put<UserResponse>(`${this._userRoute(iri)}/Password`, {
      requesterPassword: currentPassword,
      newPassword,
    });
  }

  addToGroupMembership(userIri: string, groupIri: string) {
    return this._http.post<UserResponse>(
      `${this._userRoute(userIri)}/group-memberships/${encodeURIComponent(
        groupIri
      )}`,
      {}
    );
  }

  removeFromGroupMembership(userIri: string, groupIri: string) {
    return this._http.post<UserResponse>(
      `${this._userRoute(userIri)}/group-memberships/${encodeURIComponent(
        groupIri
      )}`,
      {}
    );
  }

  addToProjectMembership(
    userIri: string,
    projectIri: string,
    adminProject = false
  ) {
    return this._http.post<UserResponse>(
      `${this._userRoute(userIri)}/project-${
        adminProject ? 'admin-' : ''
      }memberships/${encodeURIComponent(projectIri)}`,
      {}
    );
  }

  removeFromProjectMembership(
    userIri: string,
    projectIri: string,
    adminProject = false
  ) {
    return this._http.post<UserResponse>(
      `${this._userRoute(userIri)}/project-${
        adminProject ? 'admin-' : ''
      }memberships/${encodeURIComponent(projectIri)}`,
      {}
    );
  }

  updateSystemAdminMembership(iri: string, isSystemAdmin: boolean) {
    return this._http.put<UserResponse>(`${this._userRoute(iri)}/SystemAdmin`, {
      systemAdmin: isSystemAdmin,
    });
  }

  private _userRoute(id: string, idType: UserIdentifier = 'iri') {
    return `${this.baseUri}/${idType}/${encodeURIComponent(id)}`;
  }
}
