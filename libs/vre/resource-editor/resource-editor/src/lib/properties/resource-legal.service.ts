import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { Observable } from 'rxjs';

/**
 * Calls the dsp-api per-resource (data-side) authorship edit endpoint.
 *
 * TODO(verify-locally): the JSON-LD body shape, the `apiUrl` accessor, and that the auth
 * interceptor attaches the bearer token for this api-host request all need confirming against
 * a running api. The endpoint is `PUT /v2/resources/authorship` (DEV-6669).
 */
@Injectable({ providedIn: 'root' })
export class ResourceLegalService {
  constructor(
    private readonly _http: HttpClient,
    private readonly _appConfig: AppConfigService
  ) {}

  updateResourceAuthorship(
    resourceIri: string,
    resourceClassIri: string,
    authorship: string[],
    lastModificationDate?: string
  ): Observable<unknown> {
    const body: Record<string, unknown> = {
      '@id': resourceIri,
      '@type': resourceClassIri,
      [Constants.hasResourceAuthorship]: authorship,
    };
    // The API uses optimistic locking on lastModificationDate; send the resource's current value when present.
    if (lastModificationDate) {
      body[Constants.LastModificationDate] = {
        '@type': 'http://www.w3.org/2001/XMLSchema#dateTimeStamp',
        '@value': lastModificationDate,
      };
    }
    const url = `${this._appConfig.dspApiConfig.apiUrl}/v2/resources/authorship`;
    return this._http.put(url, body);
  }
}
