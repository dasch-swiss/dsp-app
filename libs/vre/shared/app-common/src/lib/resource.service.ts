import { Injectable } from '@angular/core';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  iriBase: string;

  constructor(private _acs: AppConfigService) {
    this.iriBase = this._getIriBaseWithoutTrailingSlash(this._acs.dspAppConfig.iriBase);
  }

  /**
   * gets resource path `[project-shortcode]/[resource-uuid]`
   * @param iri e.g. http://rdfh.ch/082B/SQkTPdHdTzq_gqbwj6QR-A
   * @returns resource path --> /082B/SQkTPdHdTzq_gqbwj6QR-A
   */
  getResourcePath(iri: string): string {
    return iri.replace(this.iriBase, '');
  }

  /**
   * gets resource uuid `[resource-uuid]`
   * @param iri e.g. http://rdfh.ch/082B/SQkTPdHdTzq_gqbwj6QR-A
   * @returns resource uuid --> SQkTPdHdTzq_gqbwj6QR-A
   */
  getResourceUuid(iri: string): string {
    return this.getResourcePath(iri).split('/')[2];
  }

  /**
   * gets resource iri
   * @param shortcode e.g. 082B
   * @param uuid e.g. SQkTPdHdTzq_gqbwj6QR-A
   * @returns resource iri --> http://rdfh.ch/082B/SQkTPdHdTzq_gqbwj6QR-A
   */
  getResourceIri(shortcode: string, uuid: string): string {
    return `${this.iriBase}/${shortcode}/${uuid}`;
  }

  /**
   * returns iri base without trailing slash
   * @returns iri base without trailing slash
   */
  private _getIriBaseWithoutTrailingSlash(base: string): string {
    return base.replace(/\/$/, '');
  }
}
