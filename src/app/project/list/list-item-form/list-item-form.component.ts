import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ApiResponseData, ApiResponseError, CreateChildNodeRequest, KnoraApiConnection, ListInfoResponse, ListNodeInfo, ListNodeInfoResponse, StringLiteral } from '@knora/api';
import { KnoraApiConnectionToken } from '@knora/core';

@Component({
    selector: 'app-list-item-form',
    templateUrl: './list-item-form.component.html',
    styleUrls: ['./list-item-form.component.scss']
})
export class ListItemFormComponent implements OnInit {

    /**
     * node id, in case of edit item
     */
    @Input() iri?: string;

    /**
     * project shortcode
     */
    @Input() projectcode?: string;

    /**
     * project id
     */
    @Input() projectIri?: string;

    /**
     * parent node id
     */
    @Input() parentIri?: string;

    @Input() labels?: StringLiteral[];

    // set main / pre-defined language
    @Input() language?: string;

    @Output() refreshParent: EventEmitter<ListNodeInfo> = new EventEmitter<ListNodeInfo>();

    loading: boolean;

    initComponent: boolean;

    placeholder: string = 'Append item to ';

    /**
    * form group for the form controller
    */
    form: FormGroup;

    updateData: boolean = false;

    constructor(
        @Inject(KnoraApiConnectionToken) private knoraApiConnection: KnoraApiConnection
    ) { }

    ngOnInit() {

        this.initComponent = true;

        if (this.labels && this.labels.length > 0) {
            this.placeholder = 'Edit item ';
        }

        // it can be used in the input placeholder
        if (this.parentIri) {
            this.knoraApiConnection.admin.listsEndpoint.getListNodeInfo(this.parentIri).subscribe(
                (response: ApiResponseData<ListNodeInfoResponse>) => {
                    this.placeholder += response.body.nodeinfo.labels[0].value;
                    this.initComponent = false;
                },
                (error: ApiResponseError) => {
                    console.error(error);
                }
            );
        }
    }

    submitData() {

        if (!this.labels.length) {
            return;
        }

        this.loading = true;

        if (this.iri && this.updateData) {
            // edit mode
            // TODO: update node method not yet implemented; Waiting for Knora API

            // TODO: remove setTimeout after testing position of progress indicator
            setTimeout(() => {
                this.loading = false;
            }, 500);

        } else {
            // generate the data payload
            const listItem: CreateChildNodeRequest = new CreateChildNodeRequest();
            listItem.parentNodeIri = this.parentIri;
            listItem.projectIri = this.projectIri;
            listItem.name = this.projectcode + '-' + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);

            // initialize labels
            let i = 0;
            for (const l of this.labels) {
                listItem.labels[i] = new StringLiteral();
                listItem.labels[i].language = l.language;
                listItem.labels[i].value = l.value;
                i++;
            }
            listItem.comments = []; // TODO: comments are not yet implemented in the template

            // send payload to knora's api
            this.knoraApiConnection.admin.listsEndpoint.createChildNode(listItem).subscribe(
                (response: ApiResponseData<ListNodeInfoResponse>) => {
                    this.refreshParent.emit(response.body.nodeinfo);
                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    console.error(error);
                }
            );
        }
    }

    handleData(data: StringLiteral[]) {
        // this shouldn't run on the init...
        if (!this.initComponent) {
            this.labels = data;
        }
    }

    toggleBtn(show: boolean) {
        this.updateData = show;
    }
}
