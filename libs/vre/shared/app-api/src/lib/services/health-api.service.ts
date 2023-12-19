import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HealthResponse } from '@dasch-swiss/dsp-js';
import { BaseApi } from './base-api';

@Injectable({
  providedIn: 'root',
})
export class HealthApiService extends BaseApi {
  constructor(private _http: HttpClient) {
    super('health');
  }

  get() {
    return this._http.get<HealthResponse>(this.baseUri);
  }
}
