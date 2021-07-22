import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { FileRepresentation } from '../file-representation';

@Component({
    selector: 'app-document',
    templateUrl: './document.component.html',
    styleUrls: ['./document.component.scss']
})
export class DocumentComponent implements OnInit {

    @Input() src: FileRepresentation;

    @ViewChild(PdfViewerComponent) private _pdfComponent: PdfViewerComponent;

    zoomFactor = 1.0;

    pdfQuery = '';

    constructor() { }

    ngOnInit(): void {

    }

    searchQueryChanged(newQuery: string) {
        if (newQuery !== this.pdfQuery) {
            this.pdfQuery = newQuery;
            this._pdfComponent.pdfFindController.executeCommand('find', {
                query: this.pdfQuery,
                highlightAll: true,
            });
        } else {
            this._pdfComponent.pdfFindController.executeCommand('findagain', {
                query: this.pdfQuery,
                highlightAll: true,
            });
        }
    }

}
