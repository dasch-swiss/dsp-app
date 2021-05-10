import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
    ApiResponseData,
    ApiResponseError,
    CreateListRequest,
    KnoraApiConnection,
    List,
    ListInfoResponse,
    ListNodeInfo,
    ListResponse,
    ReadProject,
    StringLiteral,
    UpdateListInfoRequest
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/dsp-ui';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';

@Component({
    selector: 'app-list-info-form',
    templateUrl: './list-info-form.component.html',
    styleUrls: ['./list-info-form.component.scss']
})
export class ListInfoFormComponent implements OnInit {

    @Input() iri?: string;

    @Input() mode: 'create' | 'update';

    // project short code
    @Input() projectCode: string;

    @Input() projectIri: string;

    @Output() closeDialog: EventEmitter<List | ListNodeInfo> = new EventEmitter<List>();

    loading: boolean;

    project: ReadProject;

    list: ListNodeInfo;

    labels: StringLiteral[];
    comments: StringLiteral[];

    // possible errors for the label
    labelErrors = {
        label: {
            'required': 'A label is required.'
        }
    };

    saveButtonDisabled = false;

    labelInvalidMessage: string;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: ErrorHandlerService
    ) { }

    ngOnInit() {

        this.loading = true;

        // get list info in case of edit mode
        if (this.mode === 'update') {
            // edit mode, get list
            this._dspApiConnection.admin.listsEndpoint.getListInfo(this.iri).subscribe(
                (response: ApiResponseData<ListInfoResponse>) => {
                    this.list = response.body.listinfo;
                    this.buildLists(response.body.listinfo);
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );

        } else {
            // build the form
            this.buildLists();
        }
    }

    buildLists(list?: ListNodeInfo): void {

        this.loading = true;
        this.labels = [];
        this.comments = [];

        if (list && list.id) {
            this.labels = list.labels;
            this.comments = list.comments;
        }

        this.loading = false;
    }

    submitData(): void {
        this.loading = true;

        if (this.mode === 'update') {
            // edit mode: update list info
            const listInfoUpdateData: UpdateListInfoRequest = new UpdateListInfoRequest();
            listInfoUpdateData.projectIri = this.projectIri;
            listInfoUpdateData.listIri = this.iri;
            listInfoUpdateData.labels = this.labels;
            listInfoUpdateData.comments = this.comments;

            this._dspApiConnection.admin.listsEndpoint.updateListInfo(listInfoUpdateData).subscribe(
                (response: ApiResponseData<ListInfoResponse>) => {
                    this.loading = false;
                    this.closeDialog.emit(response.body.listinfo);
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                    this.loading = false;
                }
            );

        } else {
            // new: create list
            const listInfoData: CreateListRequest = new CreateListRequest();
            listInfoData.projectIri = this.projectIri;
            listInfoData.labels = this.labels;
            listInfoData.comments = this.comments;

            this._dspApiConnection.admin.listsEndpoint.createList(listInfoData).subscribe(
                (response: ApiResponseData<ListResponse>) => {
                    this.closeDialog.emit(response.body.list);
                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                    this.loading = false;
                }
            );
        }
    }

    /**
     * reset the form
     */
    resetLists(ev: Event, list?: ListNodeInfo) {

        ev.preventDefault();

        list = list ? list : new ListNodeInfo();

        this.buildLists(list);
    }

    handleData(data: StringLiteral[], type: string) {

        switch (type) {
            case 'labels':
                this.labels = data;
                break;

            case 'comments':
                this.comments = data;
                break;
        }

        if (this.labels.length === 0) {
            // invalid label, don't let user submit
            this.saveButtonDisabled = true;
            this.labelInvalidMessage = this.labelErrors.label.required;
        } else {
            this.saveButtonDisabled = false;
            this.labelInvalidMessage = null;
        }
    }

}
