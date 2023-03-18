import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';

@Injectable({
    providedIn: 'root'
})
export class RepresentationService {

    constructor(
        private _errorHandler: ErrorHandlerService,
        private readonly _http: HttpClient
    ) { }


    /**
     * checks if representation file exists
     * @param urlToFile sipi url to file representation
     * @returns true if file exists
     */
    doesFileExist(urlToFile: string): boolean {
        // it seems that SIPI does not support HEAD request only --> xhr.open('HEAD')
        // this is why we have to grab the sidecar file to check if the file exists
        const pathToKnoraJson = urlToFile.substring(0, urlToFile.lastIndexOf('/')) + '/knora.json';
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
    getFileInfo(url: string, imageFilename?: string): Observable<Object> {
        const requestOptions = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            withCredentials: true
        };

        let pathToJson = '';

        if (imageFilename) {
            const index = url.indexOf(imageFilename);
            pathToJson = url.substring(0, index + imageFilename.length) + '/knora.json';
        } else {
            pathToJson = url.substring(0, url.lastIndexOf('/')) + '/knora.json';
        }

        return this._http.get(pathToJson, requestOptions);
    }

     /**
     * downloads the file
     * @param url url of the file
     * @param imageFilename optional parameter if the file is an image because the url structure differs from other file types
     */
    async downloadFile(url: string, imageFilename?: string) {
        let originalFilename;

        try {
            const res = await this._http.get(url, { responseType: 'blob', withCredentials: true }).toPromise();

            await this.getFileInfo(url, imageFilename).subscribe(
                response => {
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
                }
            );
        } catch (e) {
            this._errorHandler.showMessage(e);
        }
    }

}
