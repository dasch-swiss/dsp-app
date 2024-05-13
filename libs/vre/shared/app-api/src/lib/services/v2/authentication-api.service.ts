import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CredentialsResponse, LoginResponse } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { BaseApi } from '../base-api';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationApiService extends BaseApi {
  constructor(
    private _http: HttpClient,
    private _appConfig: AppConfigService
  ) {
    super('v2/authentication', _appConfig.dspApiConfig);
  }

  checkCredentials() {
    return this._http.get<CredentialsResponse>(this.baseUri);
  }

  login(property: 'iri' | 'email' | 'username', id: string, password: string) {
    const credentials: any = {
      password,
    };
    credentials[property] = id;

    return this._http.post<LoginResponse>(this.baseUri, credentials);
  }

  logout() {
    return this._http.delete(this.baseUri);
  }
}
