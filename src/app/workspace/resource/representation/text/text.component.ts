import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AfterViewInit, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ApiResponseError, Constants, KnoraApiConnection, ReadTextFileValue, ReadResource, UpdateFileValue, UpdateResource, UpdateValue, WriteValueResponse } from '@dasch-swiss/dsp-js';
import { mergeMap } from 'rxjs/operators';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { EmitEvent, Events, UpdatedFileEventValue, ValueOperationEventService } from '../../services/value-operation-event.service';
import { FileRepresentation } from '../file-representation';
import { RepresentationService } from '../representation.service';

@Component({
    selector: 'app-text',
    templateUrl: './text.component.html',
    styleUrls: ['./text.component.scss']
})
export class TextComponent implements OnInit, AfterViewInit {

    @Input() src: FileRepresentation;

    @Input() parentResource: ReadResource;

    @Output() loaded = new EventEmitter<boolean>();

    originalFilename: string;

    failedToLoad = false;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private readonly _http: HttpClient,
        private _dialog: MatDialog,
        private _errorHandler: ErrorHandlerService,
        private _rs: RepresentationService,
        private _valueOperationEventService: ValueOperationEventService
    ) { }

    ngOnInit(): void {
        this._getOriginalFilename();
        this.failedToLoad = !this._rs.doesFileExist(this.src.fileValue.fileUrl);
    }

    ngAfterViewInit() {
        this.loaded.emit(true);
    }

    // https://stackoverflow.com/questions/66986983/angular-10-download-file-from-firebase-link-without-opening-into-new-tab
    async downloadText(url: string) {
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

    openReplaceFileDialog(){
        const propId = this.parentResource.properties[Constants.HasTextFileValue][0].id;

        const dialogConfig: MatDialogConfig = {
            width: '800px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { mode: 'replaceFile', title: 'Text (csv, txt, xml)', subtitle: 'Update the text file of this resource' , representation: 'text', id: propId },
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
        updateRes.property = Constants.HasTextFileValue;
        updateRes.value = file;

        this._dspApiConnection.v2.values.updateValue(updateRes as UpdateResource<UpdateValue>).pipe(
            mergeMap((res: WriteValueResponse) => this._dspApiConnection.v2.values.getValue(this.parentResource.id, res.uuid))
        ).subscribe(
            (res2: ReadResource) => {
                this.src.fileValue.fileUrl = (res2.properties[Constants.HasTextFileValue][0] as ReadTextFileValue).fileUrl;
                this.src.fileValue.filename = (res2.properties[Constants.HasTextFileValue][0] as ReadTextFileValue).filename;
                this.src.fileValue.strval = (res2.properties[Constants.HasTextFileValue][0] as ReadTextFileValue).strval;

                this._getOriginalFilename();

                this._valueOperationEventService.emit(
                    new EmitEvent(Events.FileValueUpdated, new UpdatedFileEventValue(
                        res2.properties[Constants.HasTextFileValue][0])));
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }
}
