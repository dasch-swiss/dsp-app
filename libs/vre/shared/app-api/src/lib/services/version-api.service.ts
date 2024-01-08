import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { VersionResponse } from '@dasch-swiss/dsp-js';
import { AppConfig, AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { BaseApi } from './base-api';

@Injectable({
  providedIn: 'root',
})
export class VersionApiService extends BaseApi {
  constructor(
    private _http: HttpClient,
    private _appConfig: AppConfigService
  ) {
    super('version', _appConfig.dspApiConfig);
  }

  get() {
    return this._http.get<VersionResponse>(this.baseUri);
  }
}
