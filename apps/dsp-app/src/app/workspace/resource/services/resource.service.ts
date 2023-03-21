import { Injectable } from '@angular/core';
import { AppInitService } from '@dsp-app/src/app/app-init.service';

@Injectable({
    providedIn: 'root',
})
export class ResourceService {
    iriBase: string;

    constructor(private _ais: AppInitService) {
        this.iriBase = this._getIriBaseWithoutTrailingSlash(
            this._ais.dspAppConfig.iriBase
        );
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
        return this.iriBase + '/' + shortcode + '/' + uuid;
    }

    /**
     * returns iri base without trailing slash
     * @returns iri base without trailing slash
     */
    private _getIriBaseWithoutTrailingSlash(base: string): string {
        return base.replace(/\/$/, '');
    }
}
