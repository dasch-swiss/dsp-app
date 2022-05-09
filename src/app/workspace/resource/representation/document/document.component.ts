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

@Component({
    selector: 'app-document',
    templateUrl: './document.component.html',
    styleUrls: ['./document.component.scss']
})
export class DocumentComponent implements OnInit, AfterViewInit {

    @Input() src: FileRepresentation;

    @Input() parentResource: ReadResource;

    @Output() loaded = new EventEmitter<boolean>();

    @ViewChild(PdfViewerComponent) private _pdfComponent: PdfViewerComponent;

    zoomFactor = 1.0;

    pdfQuery = '';

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _dialog: MatDialog,
        private _errorHandler: ErrorHandlerService,
        private _valueOperationEventService: ValueOperationEventService
    ) { }

    ngOnInit(): void {

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

    openReplaceFileDialog(){
        const propId = this.parentResource.properties[Constants.HasDocumentFileValue][0].id;

        const dialogConfig: MatDialogConfig = {
            width: '800px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { mode: 'replaceFile', title: 'Document', subtitle: 'Update the document file of this resource' , representation: 'document', id: propId },
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
