import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';
import { FileRepresentation } from '../file-representation';

@Component({
    selector: 'app-archive',
    templateUrl: './archive.component.html',
    styleUrls: ['./archive.component.scss']
})
export class ArchiveComponent implements OnInit {

    @Input() src: FileRepresentation;
    originalFilename: string;
    temp: string;

    constructor(
        private readonly _http: HttpClient,
        private _errorHandler: ErrorHandlerService
    ) { }

    ngOnInit(): void {
        const requestOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            withCredentials: true
        };

        const pathToJson = this.src.fileValue.fileUrl.substring(0, this.src.fileValue.fileUrl.lastIndexOf('/')) + '/knora.json';

        this._http.get(pathToJson, requestOptions).subscribe(
            res => {
                this.originalFilename = res['originalFilename'];
            }
        );
    }

    // https://stackoverflow.com/questions/66986983/angular-10-download-file-from-firebase-link-without-opening-into-new-tab
    async downloadArchive(url: string) {
        try {
            const res = await this._http.get(url, { responseType: 'blob' }).toPromise();
            this.downloadFile(res);
        } catch (e) {
            this._errorHandler.showMessage(e);
        }
    }

    downloadFile(data) {
        const url = window.URL.createObjectURL(data);
        const e = document.createElement('a');
        e.href = url;

        // set filename
        if (this.originalFilename === undefined) {
            e.download = url.substr(url.lastIndexOf('/') + 1);
        } else {
            e.download = this.originalFilename;
        }

        document.body.appendChild(e);
        e.click();
        document.body.removeChild(e);
    }
}
