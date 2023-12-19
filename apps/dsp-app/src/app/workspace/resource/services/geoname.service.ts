import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { Observable, throwError } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

export interface GIS {
  longitude: number;
  latitude: number;
}

export interface DisplayPlace {
  displayName: string;
  name: string;
  country: string;
  administrativeName?: string;
  wikipediaUrl?: string;
  location: GIS;
}

export interface SearchPlace {
  id: string;
  displayName: string;
  name: string;
  administrativeName?: string;
  country: string;
  locationType: string;
}

export interface GeonameData {
  geonameId: string;
  name: string;
  asciiName: string;
  countryCode: string;
  countryName: string;
  adminName1?: string;
  fclName: string;
}

export interface GeonameResponse {
  geonames: GeonameData[];
}

@Injectable({
  providedIn: 'root',
})
export class GeonameService {
  constructor(
    private readonly _http: HttpClient,
    private _appConfigService: AppConfigService
  ) {}

  /**
   * given a geoname id, resolves the identifier.
   *
   * @param id the geiname id to resolve.
   */
  resolveGeonameID(id: string): Observable<DisplayPlace> {
    return this._http
      .get<object>(
        'https://ws.geonames.net/getJSON?geonameId=' +
          id +
          '&username=' +
          this._appConfigService.dspAppConfig.geonameToken +
          '&style=short'
      )
      .pipe(
        map(
          (geo: {
            name: string;
            countryName: string;
            adminName1?: string;
            wikipediaURL?: string;
            lat: number;
            lng: number;
          }) => {
            // assertions for TS compiler

            if (
              !(
                'name' in geo &&
                'countryName' in geo &&
                'lat' in geo &&
                'lng' in geo
              )
            ) {
              // at least one of the expected properties is not present
              throw new Error('required property missing in geonames response');
            }

            return {
              displayName:
                geo.name +
                (geo.adminName1 !== undefined ? ', ' + geo.adminName1 : '') +
                ', ' +
                geo.countryName,
              name: geo.name,
              administrativeName: geo.adminName1,
              country: geo.countryName,
              wikipediaUrl: geo.wikipediaURL,
              location: {
                longitude: geo.lng,
                latitude: geo.lat,
              },
            };
          }
        ),
        shareReplay({ refCount: false, bufferSize: 1 }), // several subscribers may use the same source Observable (one HTTP request to geonames)
        catchError(error =>
          // an error occurred
          throwError(error)
        )
      );
  }

  /**
   * given a search string, searches for places matching the string.
   *
   * @param searchString place to search for.
   */
  searchPlace(searchString: string): Observable<SearchPlace[]> {
    const url = `https://ws.geonames.net/searchJSON?userName=${
      this._appConfigService.dspAppConfig.geonameToken
    }&lang=en&style=full&maxRows=12&name_startsWith=${encodeURIComponent(
      searchString
    )}`;

    return this._http.get<GeonameResponse>(url).pipe(
      map(response => {
        return response.geonames
          .filter(
            geo => geo.geonameId && geo.name && geo.countryName && geo.fclName
          ) // only map those with required properties to avoid duplicates
          .map(geo => {
            return {
              id: geo.geonameId.toString(),
              displayName: `${geo.name}${
                geo.adminName1 ? ', ' + geo.adminName1 : ''
              }${geo.countryName ? ', ' + geo.countryName : ''}`,
              name: geo.name,
              administrativeName: geo.adminName1,
              country: geo.countryName,
              locationType: geo.fclName,
            };
          });
      }),
      catchError(error => throwError(error))
    );
  }
}
