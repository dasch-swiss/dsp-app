import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { Observable } from 'rxjs';
import { BaseApi } from '../base-api';

interface XsdDateTimeStamp {
  '@type': string;
  '@value': string;
}

interface UpdateResourceAuthorshipPayload {
  '@id': string;
  '@type': string;
  [key: string]: string | string[] | XsdDateTimeStamp;
}

/**
 * Calls the dsp-api resource-side (data-side) legal-info endpoints (DEV-6669).
 */
@Injectable({ providedIn: 'root' })
export class ResourceLegalV2ApiService extends BaseApi {
  constructor(
    private readonly _http: HttpClient,
    appConfig: AppConfigService
  ) {
    super('v2/resources/authorship', appConfig.dspApiConfig);
  }

  updateResourceAuthorship(
    resourceIri: string,
    resourceClassIri: string,
    authorship: string[],
    lastModificationDate?: string
  ): Observable<unknown> {
    const body: UpdateResourceAuthorshipPayload = {
      '@id': resourceIri,
      '@type': resourceClassIri,
      [Constants.hasResourceAuthorship]: authorship,
    };
    // The API uses optimistic locking on lastModificationDate; send the resource's current value when present.
    if (lastModificationDate) {
      body[Constants.LastModificationDate] = {
        '@type': `${Constants.Xsd}#dateTimeStamp`,
        '@value': lastModificationDate,
      };
    }
    return this._http.put(this.baseUri, body, {
      headers: new HttpHeaders({ 'Content-Type': 'application/ld+json' }),
    });
  }
}
