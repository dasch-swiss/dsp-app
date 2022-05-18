import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class RepresentationService {

    constructor() { }

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
}
