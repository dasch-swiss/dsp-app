import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CredentialsResponse, LoginResponse } from '@dasch-swiss/dsp-js';
import { BaseApi } from '../base-api';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationApiService extends BaseApi {
  constructor(private _http: HttpClient) {
    super('v2/authentication');
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
