import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ErrorHandlerService } from '../../../main/services/error-handler.service';
import { catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class RepresentationService {
    constructor(
        private _errorHandler: ErrorHandlerService,
        private readonly _http: HttpClient
    ) {}

    /**
     * checks if representation file exists
     * @param urlToFile sipi url to file representation
     * @returns true if file exists
     */
    doesFileExist(urlToFile: string): boolean {
        // it seems that SIPI does not support HEAD request only --> xhr.open('HEAD')
        // this is why we have to grab the sidecar file to check if the file exists
        const pathToKnoraJson =
            urlToFile.substring(0, urlToFile.lastIndexOf('/')) + '/knora.json';
        try {
            const xhr = new XMLHttpRequest();

            xhr.open('GET', pathToKnoraJson, false);
            xhr.withCredentials = true;
            xhr.send();

            return xhr.status === 200;
        } catch (e) {
            return false;
        }
    }

    /**
     * returns info about a file
     * @param url url of the file
     * @param imageFilename optional parameter if the file is an image because the url structure differs from other file types
     * @returns an object containing the knora.json file for the given file url
     */
    getFileInfo(url: string, imageFilename?: string): Observable<unknown> {
        const token = this._getTokenFromLocalStorage();
        const headersConfig: { [header: string]: string } = {
            'Content-Type': 'application/json',
        };

        // if there is no token, we won't add any auth header, so sipi returns
        // a json if the resource is not restricted
        if (token) {
            headersConfig['Authorization'] = `Bearer ${token}`;
        }

        const requestOptions = {
            headers: new HttpHeaders(headersConfig),
            withCredentials: true,
        };

        let pathToJson = '';

        if (imageFilename) {
            const index = url.indexOf(imageFilename);
            pathToJson =
                url.substring(0, index + imageFilename.length) + '/knora.json';
        } else {
            pathToJson = url.substring(0, url.lastIndexOf('/')) + '/knora.json';
        }
        return this._http.get(pathToJson, requestOptions).pipe(
            catchError(error => {
                // handle error in app
                this._errorHandler.showMessage(error);
                // throw console & logging service
                return throwError(error);
            })
        );
    }

    /**
     * downloads the file
     * @param url url of the file
     * @param imageFilename optional parameter if the file is an image because the url structure differs from other file types
     */
    async downloadFile(url: string, imageFilename?: string) {
        let originalFilename;

        try {
            const res = await this._http
                .get(url, { responseType: 'blob', withCredentials: true })
                .toPromise();

            await this.getFileInfo(url, imageFilename).subscribe((response) => {
                originalFilename = response['originalFilename'];

                const objUrl = window.URL.createObjectURL(res);
                const e = document.createElement('a');
                e.href = objUrl;

                // set filename
                if (originalFilename === undefined) {
                    e.download = url.substring(url.lastIndexOf('/') + 1);
                } else {
                    e.download = originalFilename;
                }

                document.body.appendChild(e);
                e.click();
                document.body.removeChild(e);
            });
        } catch (e) {
            this._errorHandler.showMessage(e);
        }
    }

    /**
     * return the jwt token from the session to authenticate
     * @return the token
     */
    private _getTokenFromLocalStorage(): string {
        let token: string;
        const session = localStorage.getItem('session');
        if (session) {
            const s = JSON.parse(session);
            token = s.user.jwt;
        }
        return token;
    }
}
