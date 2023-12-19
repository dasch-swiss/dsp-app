import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { VersionResponse } from '@dasch-swiss/dsp-js';
import { BaseApi } from './base-api';

@Injectable({
  providedIn: 'root',
})
export class VersionApiService extends BaseApi {
  constructor(private _http: HttpClient) {
    super('version');
  }

  get() {
    return this._http.get<VersionResponse>(this.baseUri);
  }
}
