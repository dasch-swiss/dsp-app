import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ApiResponseData, ApiResponseError, CreateListRequest, KnoraApiConnection, List, ListInfoResponse, ListNodeInfo, ListResponse, ReadProject, StringLiteral, UpdateListInfoRequest } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/dsp-ui';

@Component({
    selector: 'app-list-info-form',
    templateUrl: './list-info-form.component.html',
    styleUrls: ['./list-info-form.component.scss']
})
export class ListInfoFormComponent implements OnInit {

    loading: boolean;

    @Input() iri?: string;

    // project short code
    @Input() projectcode: string;

    @Input() projectIri: string;

    @Output() closeDialog: EventEmitter<List | ListNodeInfo> = new EventEmitter<List>();

    @Output() updateParent: EventEmitter<{ title: string }> = new EventEmitter<{ title: string }>();

    project: ReadProject;

    list: ListNodeInfo;

    labels: StringLiteral[];
    comments: StringLiteral[];

    /**
     * by adding new list, it starts with the list info and the next section is "creating the list";
     * true after adding list
     *
     */
    createList: boolean = false;
    newList: List;

    nameMinLength = 3;
    nameMaxLength = 16;

    /**
     * form group for the form controller
     */
    form: FormGroup;

    /**
     * error checking on the following fields
     */
    formErrors = {
        label: ''
    };

    /**
     * error hints
     */
    validationMessages = {
        label: {
            'required': 'Name is required.',
            'minlength': 'Name must be at least ' + this.nameMinLength + ' characters long.',
            'maxlength': 'Name cannot be more than ' + this.nameMaxLength + ' characters long.'
        }
    };


    /**
     * in case of an API error
     */
    errorMessage: any;

    /**
     * success of sending data
     */
    success = false;
    /**
     * message after successful post
     */
    successMessage: any = {
        status: 200,
        statusText: "You have successfully updated list's info."
    };

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection
    ) { }

    ngOnInit() {

        this.loading = true;

        // get list info in case of edit mode: this.iri is not undefined
        if (this.iri) {
            // edit mode, get list
            this._dspApiConnection.admin.listsEndpoint.getListInfo(this.iri).subscribe(
                (response: ApiResponseData<ListInfoResponse>) => {
                    this.list = response.body.listinfo;
                    this.buildForm(response.body.listinfo);
                },
                (error: ApiResponseError) => {
                    console.error(error);
                }
            );

        } else {
            // build the form
            this.buildForm();
        }
    }

    buildForm(list?: ListNodeInfo): void {

        this.loading = true;
        this.labels = [];
        this.comments = [];

        if (list && list.id) {
            this.labels = list.labels;
            this.comments = list.comments;
        }

        setTimeout(() => {
            this.loading = false;
        });
    }

    submitData(): void {
        this.loading = true;

        if (this.iri) {
            // edit mode: update list info
            const listInfoUpdateData: UpdateListInfoRequest = new UpdateListInfoRequest();
            listInfoUpdateData.projectIri = this.projectIri;
            listInfoUpdateData.listIri = this.iri;

            // initialize labels
            let i = 0;
            for (const l of this.labels) {
                listInfoUpdateData.labels[i] = new StringLiteral();
                listInfoUpdateData.labels[i].language = l.language;
                listInfoUpdateData.labels[i].value = l.value;
                i++;
            }
            // initialize comments
            let j = 0;
            for (const c of this.comments) {
                listInfoUpdateData.comments[j] = new StringLiteral();
                listInfoUpdateData.comments[j].language = c.language;
                listInfoUpdateData.comments[j].value = c.value;
                j++;
            }

            this._dspApiConnection.admin.listsEndpoint.updateListInfo(listInfoUpdateData).subscribe(
                (response: ApiResponseData<ListInfoResponse>) => {
                    this.success = true;
                    this.loading = false;
                    this.closeDialog.emit(response.body.listinfo);
                },
                (error: ApiResponseError) => {
                    this.errorMessage = error;
                    this.loading = false;
                    this.success = false;
                }
            );

        } else {
            // new: create list
            const listInfoData: CreateListRequest = new CreateListRequest();
            listInfoData.projectIri = this.projectIri;

            // initialize labels
            let i = 0;
            for (const l of this.labels) {
                listInfoData.labels[i] = new StringLiteral();
                listInfoData.labels[i].language = l.language;
                listInfoData.labels[i].value = l.value;
                i++;
            }
            // initialize comments
            let j = 0;
            for (const c of this.comments) {
                listInfoData.comments[j] = new StringLiteral();
                listInfoData.comments[j].language = c.language;
                listInfoData.comments[j].value = c.value;
                j++;
            }

            this._dspApiConnection.admin.listsEndpoint.createList(listInfoData).subscribe(
                (response: ApiResponseData<ListResponse>) => {
                    this.newList = response.body.list;

                    this.updateParent.emit({ title: response.body.list.listinfo.labels[0].value + ' (' + response.body.list.listinfo.labels[0].language + ')' });
                    this.loading = false;
                    this.createList = true;
                },
                (error: ApiResponseError) => {
                    this.errorMessage = error;
                    this.loading = false;
                    this.success = false;
                }
            );
        }
    }

    /**
     * Reset the form
     */
    resetForm(ev: Event, list?: ListNodeInfo) {

        ev.preventDefault();

        list = list ? list : new ListNodeInfo();

        this.buildForm(list);
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
    }
}
