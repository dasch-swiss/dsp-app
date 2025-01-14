import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HealthResponse } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { BaseApi } from './base-api';

@Injectable({
  providedIn: 'root',
})
export class HealthApiService extends BaseApi {
  constructor(
    private _http: HttpClient,
    private _appConfig: AppConfigService
  ) {
    super('health', _appConfig.dspApiConfig);
  }

  get() {
    return this._http.get<HealthResponse>(this.baseUri);
  }
}
