import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import {
  KnoraApiConnection,
  ReadIntervalValue,
  ReadResourceSequence,
  ReadTextValueAsString,
} from '@dasch-swiss/dsp-js';
import { DspResource, GenerateProperty } from '@dasch-swiss/vre/shared/app-common';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AccessTokenService } from '@dasch-swiss/vre/shared/app-session';
import { map } from 'rxjs/operators';
import { Segment } from './segment';
import { SegmentOrdering } from './segment-ordering';

@Injectable({
  providedIn: 'root',
})
export class SegmentApiService {
  constructor(
    private _http: HttpClient,
    private _accessTokenService: AccessTokenService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _appConfig: AppConfigService
  ) {}

  createSegment(
    type: 'VideoSegment' | 'AudioSegment',
    resourceIri: string,
    projectIri: string,
    label: string,
    start: number,
    end: number,
    comment?: string,
    title?: string,
    description?: string,
    keyword?: string
  ) {
    const bearerToken = this._accessTokenService.getAccessToken();
    const headerOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`,
      }),
    };

    const parameterType = `http://api.knora.org/ontology/knora-api/v2#is${type}OfValue`;

    return this._http.post(
      `${this._appConfig.dspApiConfig.apiUrl}/v2/resources`,
      {
        '@type': `http://api.knora.org/ontology/knora-api/v2#${type}`,
        'http://www.w3.org/2000/01/rdf-schema#label': label,
        'http://api.knora.org/ontology/knora-api/v2#attachedToProject': {
          '@id': projectIri,
        },
        [parameterType]: {
          '@type': 'http://api.knora.org/ontology/knora-api/v2#LinkValue',
          'http://api.knora.org/ontology/knora-api/v2#linkValueHasTargetIri': {
            '@id': resourceIri,
          },
        },
        'http://api.knora.org/ontology/knora-api/v2#hasSegmentBounds': {
          '@type': 'http://api.knora.org/ontology/knora-api/v2#IntervalValue',
          'http://api.knora.org/ontology/knora-api/v2#intervalValueHasStart': {
            '@value': start.toString(),
            '@type': 'http://www.w3.org/2001/XMLSchema#decimal',
          },
          'http://api.knora.org/ontology/knora-api/v2#intervalValueHasEnd': {
            '@value': end.toString(),
            '@type': 'http://www.w3.org/2001/XMLSchema#decimal',
          },
        },
        ...(comment
          ? {
              'http://api.knora.org/ontology/knora-api/v2#hasComment': {
                '@type': 'http://api.knora.org/ontology/knora-api/v2#TextValue',
                'http://api.knora.org/ontology/knora-api/v2#valueAsString': comment,
              },
            }
          : {}),
        ...(title
          ? {
              'http://api.knora.org/ontology/knora-api/v2#hasTitle': {
                '@type': 'http://api.knora.org/ontology/knora-api/v2#TextValue',
                'http://api.knora.org/ontology/knora-api/v2#valueAsString': title,
              },
            }
          : {}),
        ...(description
          ? {
              'http://api.knora.org/ontology/knora-api/v2#hasDescription': {
                '@type': 'http://api.knora.org/ontology/knora-api/v2#TextValue',
                'http://api.knora.org/ontology/knora-api/v2#valueAsString': description,
              },
            }
          : {}),
        ...(keyword
          ? {
              'http://api.knora.org/ontology/knora-api/v2#hasKeyword': {
                '@type': 'http://api.knora.org/ontology/knora-api/v2#TextValue',
                'http://api.knora.org/ontology/knora-api/v2#valueAsString': keyword,
              },
            }
          : {}),
      },
      headerOptions
    );
  }

  getSegment(type: 'VideoSegment' | 'AudioSegment', resourceIri: string, page: number) {
    const payload = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/simple/v2#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>


CONSTRUCT {
  ?segment knora-api:isMainResource true .
  ?segment knora-api:is${type}Of <${resourceIri}> .
  ?segment knora-api:hasSegmentBounds ?bounds .
  ?segment knora-api:hasTitle ?title .
  ?segment knora-api:hasDescription ?description .
  ?segment knora-api:hasKeyword ?keyword .
  ?segment knora-api:hasComment ?comment .
  ?segment knora-api:relatesTo ?relatesTo .
} WHERE {
  <${resourceIri}> a knora-api:${type === 'VideoSegment' ? 'MovingImageRepresentation' : 'AudioRepresentation'} .
  ?segment knora-api:is${type}Of <${resourceIri}> .
  ?segment rdfs:label ?label .
  ?segment knora-api:hasSegmentBounds ?bounds

  OPTIONAL {
    ?segment knora-api:hasTitle ?title .
  }
  OPTIONAL {
    ?segment knora-api:hasDescription ?description .
  }
  OPTIONAL {
    ?segment knora-api:hasKeyword ?keyword .
  }
  OPTIONAL {
    ?segment knora-api:hasComment ?comment .
  }
   OPTIONAL {
    ?segment knora-api:relatesTo ?relatesTo .
  }

}
OFFSET ${page}
`;

    return this._dspApiConnection.v2.search.doExtendedSearch(payload).pipe(
      map(value => {
        const endpoint = 'http://api.knora.org/ontology/knora-api/v2#';

        return (value as ReadResourceSequence).resources.map(resource => {
          const data = {
            hasSegmentBounds: resource.properties[`${endpoint}hasSegmentBounds`] as ReadIntervalValue[],
            [`has${type}OfValue`]: resource.properties[`${endpoint}has${type}OfValue`] as
              | ReadTextValueAsString[]
              | undefined,
            hasComment: resource.properties[`${endpoint}hasComment`] as ReadTextValueAsString[] | undefined,
            hasDescription: resource.properties[`${endpoint}hasDescription`] as ReadTextValueAsString[] | undefined,
            hasKeyword: resource.properties[`${endpoint}hasKeyword`] as ReadTextValueAsString[] | undefined,
            hasTitle: resource.properties[`${endpoint}hasTitle`] as ReadTextValueAsString[] | undefined,
          };

          const mappedObject = Object.entries(data).reduce((acc, [key, value_]) => {
            acc[key] = value_ !== undefined ? value_![0] : undefined;
            return acc;
          }, {});

          const dspResource = new DspResource(resource);
          dspResource.resProps = GenerateProperty.segmentProperty(resource, type);

          return { ...mappedObject, label: resource.label, resource: dspResource, row: 0 } as Segment;
        });
      }),
      map(v => SegmentOrdering.createSegment(v))
    );
  }
}
