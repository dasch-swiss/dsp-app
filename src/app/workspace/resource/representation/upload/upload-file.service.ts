import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppInitService, SessionService } from '@dasch-swiss/dsp-ui';
import { Observable } from 'rxjs';

interface UploadedFile {
    fileType: string;
    internalFilename: string;
    originalFilename: string;
    temporaryUrl: string;
}

export interface UploadedFileResponse {
    uploadedFiles: UploadedFile[];
}

@Injectable({
    providedIn: 'root'
})
export class UploadFileService {

    sipiHost: string = this._init.config['sipiUrl'];

    constructor(
        private readonly _init: AppInitService,
        private readonly _http: HttpClient,
        private readonly _session: SessionService
    ) { }

    /**
     * uploads files to SIPI
     * @param (file)
     */
    upload(file: FormData): Observable<UploadedFileResponse> {
        const baseUrl = `${this.sipiHost}upload`;

        // checks if user is logged in
        const jwt = this._session.getSession()?.user.jwt;
        const params = new HttpParams().set('token', jwt);

        // --> TODO in order to track the progress change below to true and 'events'
        const options = { params, reportProgress: false, observe: 'body' as 'body' };
        return this._http.post<UploadedFileResponse>(baseUrl, file, options);
    }
}
