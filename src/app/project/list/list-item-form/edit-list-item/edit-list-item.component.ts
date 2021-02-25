import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { ApiResponseData, ApiResponseError, ChildNodeInfoResponse, CreateChildNodeRequest, KnoraApiConnection, List, ListNodeInfo, ListNodeInfoResponse, StringLiteral, UpdateChildNodeRequest } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/dsp-ui';

@Component({
  selector: 'app-edit-list-item',
  templateUrl: './edit-list-item.component.html',
  styleUrls: ['./edit-list-item.component.scss']
})
export class EditListItemComponent implements OnInit {
    loading: boolean;

    @Input() iri: string;

    @Input() projectIri: string;

    @Input() mode: 'insert' | 'update';

    @Input() position?: number;

    @Input() projectCode?: string;

    @Input() parentIri?: string;

    @Output() closeDialog: EventEmitter<List | ListNodeInfo> = new EventEmitter<List>();

    // the list node being edited
    listNode: ListNodeInfo;

    // local arrays to use when updating the list node
    labels: StringLiteral[];
    comments: StringLiteral[];

    /**
     * error checking on the following fields
     */
    formErrors = {
        label: {
            'required': 'A label is required.'
        }
    };

    /**
     * in case of an API error
     */
    errorMessage: any;

    saveButtonDisabled = false;

    formInvalidMessage: string;

    constructor(@Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection) { }

    ngOnInit(): void {
        this.loading = true;

        // if updating a node, get the existing node info
        if (this.mode === 'update') {
            this._dspApiConnection.admin.listsEndpoint.getListNodeInfo(this.iri).subscribe(
                (response: ApiResponseData<ListNodeInfoResponse>) => {
                    this.listNode = response.body.nodeinfo;
                    this.buildForm(response.body.nodeinfo);
                },
                (error: ApiResponseError) => {
                    console.error(error);
                }
            );
        } else {
            this.labels = [];
            this.comments = [];

            this.loading = false;
        }
    }

    /**
     * Separates the labels and comments of a list node into two local arrays.
     *
     * @param listNode info about a list node
     */
    buildForm(listNode: ListNodeInfo): void {

        this.labels = [];
        this.comments = [];

        if (listNode && listNode.id) {
            this.labels = listNode.labels;
            this.comments = listNode.comments;
        }

        this.loading = false;
    }

    /**
     * Called from the template any time the labels or comments are changed to update the local arrays.
     * At least one label is required. Otherwise, the 'update' button will be disabled.
     *
     * @param data the data that was changed
     * @param type the type of data that was changed
     */
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
            // invalid form, don't let user submit
            this.saveButtonDisabled = true;
            this.formInvalidMessage = this.formErrors.label.required;
        } else {
            this.saveButtonDisabled = false;
            this.formInvalidMessage = null;
        }
    }

    /**
     * Called from the template when the 'update' button is clicked.
     * Sends a request to DSP-API to update the list node with the data inside the two local arrays.
     */
    updateChildNode() {
        const childNodeUpdateData: UpdateChildNodeRequest = new UpdateChildNodeRequest();
        childNodeUpdateData.projectIri = this.projectIri;
        childNodeUpdateData.listIri = this.iri;
        childNodeUpdateData.labels = this.labels;
        childNodeUpdateData.comments = this.comments.length > 0 ? this.comments : [];

        this._dspApiConnection.admin.listsEndpoint.updateChildNode(childNodeUpdateData).subscribe(
            (response: ApiResponseData<ChildNodeInfoResponse>) => {
                this.loading = false;
                this.closeDialog.emit(response.body.nodeinfo);
            },
            (error: ApiResponseError) => {
                this.errorMessage = error;
                this.loading = false;
            }
        );
    }

    insertChildNode() {
        const createChildNodeRequest: CreateChildNodeRequest = new CreateChildNodeRequest();

        createChildNodeRequest.name = this.projectCode + '-' + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
        createChildNodeRequest.parentNodeIri = this.parentIri;
        createChildNodeRequest.labels = this.labels;
        createChildNodeRequest.comments = this.comments.length > 0 ? this.comments : [];
        createChildNodeRequest.projectIri = this.projectIri;
        createChildNodeRequest.position = this.position;

        this._dspApiConnection.admin.listsEndpoint.createChildNode(createChildNodeRequest).subscribe(
            (response: ApiResponseData<ListNodeInfoResponse>) => {
                this.loading = false;
                this.closeDialog.emit(response.body.nodeinfo);
            },
            (error: ApiResponseError) => {
                this.errorMessage = error;
                this.loading = false;
            }
        );
    }

}
