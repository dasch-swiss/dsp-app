import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateGroupRequest, GroupsResponse, UpdateGroupRequest } from '@dasch-swiss/dsp-js';
import { BaseApi } from '../base-api';

@Injectable({
  providedIn: 'root',
})
export class GroupApiService extends BaseApi {
  constructor(private _http: HttpClient) {
    super('admin/groups');
  }

  list() {
    return this._http.get<GroupsResponse>(this.baseUri);
  }

  get(iri: string) {
    return this._http.get<GroupsResponse>(this._groupRoute(iri));
  }

  create(group: CreateGroupRequest) {
    return this._http.post<GroupsResponse>(this.baseUri, group);
  }

  update(iri: string, updatedGroup: UpdateGroupRequest) {
    return this._http.put<GroupsResponse>(this._groupRoute(iri), updatedGroup);
  }

  updateStatus(iri: string, status: boolean) {
    return this._http.put<GroupsResponse>(`${this._groupRoute(iri)}/status`, {
      status,
    });
  }

  delete(iri: string) {
    return this._http.delete<GroupsResponse>(this._groupRoute(iri));
  }

  private _groupRoute(iri: string) {
    return `${this.baseUri}/${encodeURIComponent(iri)}`;
  }
}
