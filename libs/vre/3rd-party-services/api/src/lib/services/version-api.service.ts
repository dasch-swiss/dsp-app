import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { Observable } from 'rxjs';

export interface VersionResponse {
  webapi: string;
  buildCommit: string;
  buildTime: string;
  fuseki: string;
  scala: string;
  sipi: string;
  name: string;
}

/**
 * Calls the dsp-api `/version` endpoint, which lives at the host root (outside `apiPath`).
 */
@Injectable({ providedIn: 'root' })
export class VersionApiService {
  constructor(
    private readonly _http: HttpClient,
    private readonly _appConfigService: AppConfigService
  ) {}

  getVersion(): Observable<VersionResponse> {
    const apiConfig = this._appConfigService.dspApiConfig;
    const portSuffix = apiConfig.apiPort !== null ? `:${apiConfig.apiPort}` : '';
    return this._http.get<VersionResponse>(`${apiConfig.apiProtocol}://${apiConfig.apiHost}${portSuffix}/version`);
  }
}
