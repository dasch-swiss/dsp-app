import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UpdateFileValue, UpdateResource, Constants, UpdateValue, WriteValueResponse, ReadResource, ApiResponseError, KnoraApiConnection, ReadAudioFileValue } from '@dasch-swiss/dsp-js';
import { mergeMap } from 'rxjs/operators';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';
import { EmitEvent, Events, UpdatedFileEventValue, ValueOperationEventService } from '../../services/value-operation-event.service';

import { FileRepresentation } from '../file-representation';

@Component({
    selector: 'app-audio',
    templateUrl: './audio.component.html',
    styleUrls: ['./audio.component.scss']
})
export class AudioComponent implements OnInit {

    @Input() src: FileRepresentation;
    @Input() parentResource: ReadResource;

    audio: SafeUrl;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _sanitizer: DomSanitizer,
        private _dialog: MatDialog,
        private _errorHandler: ErrorHandlerService,
        private _valueOperationEventService: ValueOperationEventService
    ) { }

    ngOnInit(): void {
        this.audio = this._sanitizer.bypassSecurityTrustUrl(this.src.fileValue.fileUrl);
    }

    openReplaceFileDialog(){
        const propId = this.parentResource.properties[Constants.HasAudioFileValue][0].id;

        const dialogConfig: MatDialogConfig = {
            width: '800px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { mode: 'replaceFile', title: 'Audio', subtitle: 'Update the audio file of this resource' , representation: 'audio', id: propId },
            disableClose: true
        };
        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe((data) => {
            this._replaceFile(data);
        });
    }

    private _replaceFile(file: UpdateFileValue) {
        const updateRes = new UpdateResource();
        updateRes.id = this.parentResource.id;
        updateRes.type = this.parentResource.type;
        updateRes.property = Constants.HasAudioFileValue;
        updateRes.value = file;

        this._dspApiConnection.v2.values.updateValue(updateRes as UpdateResource<UpdateValue>).pipe(
            mergeMap((res: WriteValueResponse) => this._dspApiConnection.v2.values.getValue(this.parentResource.id, res.uuid))
        ).subscribe(
            (res2: ReadResource) => {

                this.src.fileValue.fileUrl = (res2.properties[Constants.HasAudioFileValue][0] as ReadAudioFileValue).fileUrl;
                this.src.fileValue.filename = (res2.properties[Constants.HasAudioFileValue][0] as ReadAudioFileValue).filename;
                this.src.fileValue.strval = (res2.properties[Constants.HasAudioFileValue][0] as ReadAudioFileValue).strval;
                this.src.fileValue.valueCreationDate = (res2.properties[Constants.HasAudioFileValue][0] as ReadAudioFileValue).valueCreationDate;

                this.audio = this._sanitizer.bypassSecurityTrustUrl(this.src.fileValue.fileUrl);

                this._valueOperationEventService.emit(
                    new EmitEvent(Events.FileValueUpdated, new UpdatedFileEventValue(
                        res2.properties[Constants.HasAudioFileValue][0])));

                const audioElem = document.getElementById('audio');
                (audioElem as HTMLAudioElement).load();

            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

}
