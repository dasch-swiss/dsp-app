import { AfterViewInit, Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
    ApiResponseError,
    Constants,
    KnoraApiConnection,
    ReadDocumentFileValue,
    ReadResource,
    UpdateFileValue,
    UpdateResource,
    UpdateValue,
    WriteValueResponse
} from '@dasch-swiss/dsp-js';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { mergeMap } from 'rxjs/operators';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { EmitEvent, Events, UpdatedFileEventValue, ValueOperationEventService } from '../../services/value-operation-event.service';
import { FileRepresentation } from '../file-representation';
import { RepresentationService } from '../representation.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';

@Component({
    selector: 'app-document',
    templateUrl: './document.component.html',
    styleUrls: ['./document.component.scss']
})
export class DocumentComponent implements OnInit, AfterViewInit {

    @Input() src: FileRepresentation;

    @Input() parentResource: ReadResource;

    @Output() loaded = new EventEmitter<boolean>();

    originalFilename: string;

    zoomFactor = 1.0;

    pdfQuery = '';

    failedToLoad = false;

    elem: any;

    fileType: string;

    @ViewChild(PdfViewerComponent) private _pdfComponent: PdfViewerComponent;

    constructor(
        @Inject(DOCUMENT) private document: any,
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private readonly _http: HttpClient,
        private _dialog: MatDialog,
        private _errorHandler: ErrorHandlerService,
        private _rs: RepresentationService,
        private _valueOperationEventService: ValueOperationEventService
    ) { }

    ngOnInit(): void {
        this.fileType = this._getFileType(this.src.fileValue.filename);
        if (this.fileType === 'pdf') {
            this.elem = document.getElementsByClassName('pdf-viewer')[0];
        }
        this._getOriginalFilename();
        this.failedToLoad = !this._rs.doesFileExist(this.src.fileValue.fileUrl);
    }

    ngAfterViewInit() {
        this.loaded.emit(true);
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

    async downloadDocument(url: string) {
        try {
            const res = await this._http.get(url, { responseType: 'blob', withCredentials: true }).toPromise();
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
            e.download = url.substring(url.lastIndexOf('/') + 1);
        } else {
            e.download = this.originalFilename;
        }

        document.body.appendChild(e);
        e.click();
        document.body.removeChild(e);
    }

    openReplaceFileDialog() {
        const propId = this.parentResource.properties[Constants.HasDocumentFileValue][0].id;

        const dialogConfig: MatDialogConfig = {
            width: '800px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { mode: 'replaceFile', title: 'Document', subtitle: 'Update the document file of this resource', representation: 'document', id: propId },
            disableClose: true
        };
        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe((data) => {
            if (data) {
                this._replaceFile(data);
            }
        });
    }

    openFullscreen() {
        if (this.elem.requestFullscreen) {
            this.elem.requestFullscreen();
        } else if (this.elem.mozRequestFullScreen) {
            // firefox
            this.elem.mozRequestFullScreen();
        } else if (this.elem.webkitRequestFullscreen) {
            // chrome, safari and opera
            this.elem.webkitRequestFullscreen();
        } else if (this.elem.msRequestFullscreen) {
            // edge, ie
            this.elem.msRequestFullscreen();
        }
    }

    private _getFileType(filename: string): string {
        return filename.split('.').pop();
    }

    private _getOriginalFilename() {
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

    private _replaceFile(file: UpdateFileValue) {
        const updateRes = new UpdateResource();
        updateRes.id = this.parentResource.id;
        updateRes.type = this.parentResource.type;
        updateRes.property = Constants.HasDocumentFileValue;
        updateRes.value = file;

        this._dspApiConnection.v2.values.updateValue(updateRes as UpdateResource<UpdateValue>).pipe(
            mergeMap((res: WriteValueResponse) => this._dspApiConnection.v2.values.getValue(this.parentResource.id, res.uuid))
        ).subscribe(
            (res2: ReadResource) => {

                this.src.fileValue.fileUrl = (res2.properties[Constants.HasDocumentFileValue][0] as ReadDocumentFileValue).fileUrl;
                this.src.fileValue.filename = (res2.properties[Constants.HasDocumentFileValue][0] as ReadDocumentFileValue).filename;
                this.src.fileValue.strval = (res2.properties[Constants.HasDocumentFileValue][0] as ReadDocumentFileValue).strval;
                this.src.fileValue.valueCreationDate = (res2.properties[Constants.HasDocumentFileValue][0] as ReadDocumentFileValue).valueCreationDate;

                this.fileType = this._getFileType(this.src.fileValue.filename);
                if (this.fileType === 'pdf') {
                    this.elem = document.getElementsByClassName('pdf-viewer')[0];
                }
                this._getOriginalFilename();

                this.zoomFactor = 1.0;
                this.pdfQuery = '';

                this._valueOperationEventService.emit(
                    new EmitEvent(Events.FileValueUpdated, new UpdatedFileEventValue(
                        res2.properties[Constants.HasDocumentFileValue][0])));
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

}
