import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApi } from './base-api';
import { VersionResponse } from '@dasch-swiss/dsp-js';

@Injectable({
    providedIn: 'root'
})
export class VersionApiService extends BaseApi {
    constructor(private _http: HttpClient) {
        super('version');
    }

    get() {
        return this._http.get<VersionResponse>(this.baseUri);
    }
}
