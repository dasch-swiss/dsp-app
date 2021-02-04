import { Component, Inject, Input, OnInit } from '@angular/core';
import {
    ApiResponseData,
    ApiResponseError,
    ChildNodeInfo,
    KnoraApiConnection,
    ListNode,
    ListResponse
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/dsp-ui';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';

@Component({
    selector: 'app-list-item',
    templateUrl: './list-item.component.html',
    styleUrls: ['./list-item.component.scss']
})
export class ListItemComponent implements OnInit {

    @Input() list: ListNode[];

    @Input() parentIri?: string;

    @Input() projectcode: string;

    @Input() projectIri: string;

    @Input() childNode: boolean;

    @Input() language?: string;

    expandedNode: string;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: ErrorHandlerService
    ) { }

    ngOnInit() {

        // in case of parent node: do not run the following request
        if (!this.childNode) {
            this._dspApiConnection.admin.listsEndpoint.getList(this.parentIri).subscribe(
                (result: ApiResponseData<ListResponse>) => {
                    this.list = result.body.list.children;
                    this.language = result.body.list.listinfo.labels[0].language;
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
        }
    }

    /**
     * Checks if parent node should show its children.
     * @param id id of parent node.
     */
    showChildren(id: string): boolean {
        return (id === this.expandedNode);
    }

    /**
     * Called from template when the 'expand' button is clicked.
     *
     * @param id id of parent node for which the 'expand' button was clicked.
     */
    toggleChildren(id: string) {

        if (this.showChildren(id)) {
            this.expandedNode = undefined;
        } else {
            this.expandedNode = id;
        }

    }

    /**
     * Called when the 'refreshParent' event from ListItemFormComponent is triggered.
     *
     * @param data info about the node; can be a root node or child node.
     * @param firstNode states whether or not the node is a new child node; defaults to false.
     */
    updateView(data: ListNode, firstNode: boolean = false) {

        if (data instanceof ChildNodeInfo) {
            this.list[data.position].labels = data.labels;
            this.list[data.position].comments = data.comments;
        } else {
            // update the view by updating the existing list
            if (firstNode) {
                // in case of new child node, we have to use the children from list
                const index: number = this.list.findIndex(item => item.id === this.expandedNode);
                this.list[index].children.push(data);

            } else {
                this.list.push(data);
            }

            data.children = [];
        }

    }

}
