import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import {
    ApiResponseData,
    ApiResponseError,
    KnoraApiConnection,
    ListChildNodeResponse,
    ListNode,
    ListResponse,
    ReadProject,
    RepositionChildNodeRequest,
    RepositionChildNodeResponse,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { ListNodeOperation } from '../list-item-form/list-item-form.component';
import { Session, SessionService } from '../../../main/services/session.service';
import { CacheService } from '../../../main/cache/cache.service';

@Component({
    selector: 'app-list-item',
    templateUrl: './list-item.component.html',
    styleUrls: ['./list-item.component.scss']
})
export class ListItemComponent implements OnInit {

    @Input() list: ListNode[];

    @Input() parentIri?: string;

    @Input() projectUuid: string;

    @Input() projectStatus: boolean;

    @Input() projectIri: string;

    @Input() childNode: boolean;

    @Input() language?: string;

    @Output() refreshChildren: EventEmitter<ListNode[]> = new EventEmitter<ListNode[]>();

    // permissions of logged-in user
    session: Session;
    sysAdmin = false;
    projectAdmin = false;

    expandedNode: string;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: ErrorHandlerService,
        private _session: SessionService,
        private _cache: CacheService,
    ) { }

    ngOnInit() {
        // get information about the logged-in user
        this.session = this._session.getSession();

        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        // get the project data from cache
        this._cache.get(this.projectUuid).subscribe(
            (response: ReadProject) => {
                // is logged-in user projectAdmin?
                this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === response.id);
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );

        // in case of parent node: run the following request to get the entire list
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
     * checks if parent node should show its children.
     * @param id id of parent node.
     */
    showChildren(id: string): boolean {
        return (id === this.expandedNode);
    }

    /**
     * called from template when the 'expand' button is clicked.
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
     * called when the 'refreshParent' event from ListItemFormComponent is triggered.
     *
     * @param data info about the operation that was performed on the node and should be reflected in the UI.
     * @param firstNode states whether or not the node is a new child node; defaults to false.
     */
    updateView(data: ListNodeOperation, firstNode: boolean = false) {
        // update the view by updating the existing list
        if (data instanceof ListNodeOperation) {
            switch (data.operation) {
                case 'create': {
                    if (firstNode) {
                        // in case of new child node, we have to use the children from list
                        const index: number = this.list.findIndex(item => item.id === this.expandedNode);
                        this.list[index].children.push(data.listNode);

                    } else {
                        this.list.push(data.listNode);
                    }
                    break;
                }
                case 'insert': {
                    // get the corresponding list from the API again and reassign the local list with its response
                    this._dspApiConnection.admin.listsEndpoint.getList(this.parentIri).subscribe(
                        (result: ApiResponseData<ListResponse | ListChildNodeResponse>) => {
                            if (result.body instanceof ListResponse) {
                                this.list = result.body.list.children; // root node
                            } else {
                                this.list = result.body.node.children; // child node
                            }

                            // emit the updated list of children to the parent node
                            this.refreshChildren.emit(this.list);
                        },
                        (error: ApiResponseError) => {
                            this._errorHandler.showMessage(error);
                        }
                    );
                    break;
                }
                case 'update': {
                    // use the position from the response from DSP-API to find the correct node to update
                    this.list[data.listNode.position].labels = data.listNode.labels;
                    this.list[data.listNode.position].comments = data.listNode.comments;
                    break;
                }
                case 'delete': {
                    // conveniently, the response returned by DSP-API contains the entire list without the deleted node within its 'children'
                    // we can just reassign the list to this
                    this.list = data.listNode.children;

                    // emit the updated list of children to the parent node
                    this.refreshChildren.emit(this.list);
                    break;
                }
                case 'reposition': {
                    const repositionRequest: RepositionChildNodeRequest = new RepositionChildNodeRequest();
                    repositionRequest.parentNodeIri = this.parentIri;
                    repositionRequest.position = data.listNode.position;

                    // since we don't have any way to know the parent IRI from the ListItemForm component, we need to do the API call here
                    // --> TODO now we have the parent IRI within the ListItemForm component so we can move this logic there
                    this._dspApiConnection.admin.listsEndpoint.repositionChildNode(data.listNode.id, repositionRequest).subscribe(
                        (res: ApiResponseData<RepositionChildNodeResponse>) => {
                            this.list = res.body.node.children;

                            this.refreshChildren.emit(this.list);
                        }
                    );
                    break;
                }
                default: {
                    break;
                }
            }
        }
    }

    /**
     * updates the children of the parent node
     *
     * @param children the updated list of children nodes
     * @param position the position of the parent node
     */
    updateParentNodeChildren(children: ListNode[], position: number) {
        this.list[position].children = children;
    }

}
