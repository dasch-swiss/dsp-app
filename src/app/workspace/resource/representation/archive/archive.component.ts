import { HttpClient } from '@angular/common/http';
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

    constructor(
        private readonly _http: HttpClient,
        private _errorHandler: ErrorHandlerService
    ) { }

    ngOnInit(): void { }

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
        e.download = url.substr(url.lastIndexOf('/') + 1);
        document.body.appendChild(e);
        e.click();
        document.body.removeChild(e);
    }
}
