import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';
import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
    ApiResponseData,
    ApiResponseError,
    ChildNodeInfo,
    CreateChildNodeRequest,
    DeleteListNodeResponse,
    KnoraApiConnection,
    ListInfoResponse,
    ListNode,
    ListNodeInfoResponse,
    ReadProject,
    StringLiteral,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '../../../main/dialog/dialog.component';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import {
    Session,
    SessionService,
} from '@dasch-swiss/vre/shared/app-session';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';

export class ListNodeOperation {
    operation: 'create' | 'insert' | 'update' | 'delete' | 'reposition';
    listNode: ListNode;
}

@Component({
    selector: 'app-list-item-form',
    templateUrl: './list-item-form.component.html',
    styleUrls: ['./list-item-form.component.scss'],
    animations: [
        // the fade-in/fade-out animation.
        // https://www.kdechant.com/blog/angular-animations-fade-in-and-fade-out
        trigger('simpleFadeAnimation', [
            // the "in" style determines the "resting" state of the element when it is visible.
            state('in', style({ opacity: 1 })),

            // fade in when created.
            transition(':enter', [
                // the styles start from this point when the element appears
                style({ opacity: 0 }),
                // and animate toward the "in" state above
                animate(150),
            ]),

            // fade out when destroyed.
            transition(
                ':leave',
                // fading out uses a different syntax, with the "style" being passed into animate()
                animate(150, style({ opacity: 0 }))
            ),
        ]),
    ],
})
export class ListItemFormComponent implements OnInit {
    /**
     * node id, in case of edit item
     */
    @Input() iri?: string;

    /**
     * project uuid
     */
    @Input() projectUuid?: string;

    /**
     * project status
     */
    @Input() projectStatus?: boolean;

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

    @Input() position: number;

    // is this node in the last position of the list
    @Input() lastPosition = false;

    @Input() newNode = false;

    @Output() refreshParent: EventEmitter<ListNodeOperation> =
        new EventEmitter<ListNodeOperation>();

    // permissions of logged-in user
    session: Session;
    sysAdmin = false;
    projectAdmin = false;

    loading: boolean;

    initComponent: boolean;

    placeholder = 'Append item to ';

    showActionBubble = false;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: AppErrorHandler,
        private _dialog: MatDialog,
        private _session: SessionService,
        private _applicationStateService: ApplicationStateService
    ) {}

    ngOnInit() {
        // get information about the logged-in user
        this.session = this._session.getSession();

        // is the logged-in user system admin?
        this.sysAdmin = this.session ? this.session.user.sysAdmin : false;

        if (this.session) {
            // get the project data from application state service
            this._applicationStateService.get(this.projectUuid).subscribe(
                (response: ReadProject) => {
                    // is logged-in user projectAdmin?
                    this.projectAdmin = this.sysAdmin
                        ? this.sysAdmin
                        : this.session.user.projectAdmin.some(
                              (e) => e === response.id
                          );
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
        }

        this.initComponent = true;

        if (this.labels && this.labels.length > 0) {
            this.placeholder = 'Edit item ';
        }

        // it can be used in the input placeholder
        if (this.newNode) {
            this._dspApiConnection.admin.listsEndpoint
                .getListNodeInfo(this.parentIri)
                .subscribe(
                    (
                        response: ApiResponseData<
                            ListNodeInfoResponse | ListInfoResponse
                        >
                    ) => {
                        if (response.body instanceof ListInfoResponse) {
                            // root node
                            this.placeholder +=
                                response.body.listinfo.labels[0].value;
                        } else {
                            // child node
                            this.placeholder +=
                                response.body.nodeinfo.labels[0].value;
                        }

                        this.initComponent = false;
                    },
                    (error: ApiResponseError) => {
                        this._errorHandler.showMessage(error);
                    }
                );
        }
    }

    /**
     * called from the template when the plus button is clicked.
     * Sends the info to make a new child node to DSP-API and refreshes the UI to show the newly added node at the end of the list.
     */
    createChildNode() {
        if (!this.labels.length) {
            return;
        }

        this.loading = true;

        // generate the data payload
        const childNode: CreateChildNodeRequest = new CreateChildNodeRequest();
        childNode.parentNodeIri = this.parentIri;
        childNode.projectIri = this.projectIri;
        childNode.name =
            this.projectUuid +
            '-' +
            Math.random().toString(36).substring(2) +
            Math.random().toString(36).substring(2);

        // initialize labels
        let i = 0;
        for (const l of this.labels) {
            childNode.labels[i] = new StringLiteral();
            childNode.labels[i].language = l.language;
            childNode.labels[i].value = l.value;
            i++;
        }
        // childNode.comments = []; // --> TODO comments are not yet implemented in the template

        // init data to emit to parent
        const listNodeOperation: ListNodeOperation = new ListNodeOperation();

        // send payload to dsp-api's api
        this._dspApiConnection.admin.listsEndpoint
            .createChildNode(childNode)
            .subscribe(
                (response: ApiResponseData<ListNodeInfoResponse>) => {
                    // this needs to return a ListNode as opposed to a ListNodeInfo, so we make one
                    listNodeOperation.listNode = new ListNode();
                    listNodeOperation.listNode.hasRootNode =
                        response.body.nodeinfo.hasRootNode;
                    listNodeOperation.listNode.id = response.body.nodeinfo.id;
                    listNodeOperation.listNode.labels =
                        response.body.nodeinfo.labels;
                    listNodeOperation.listNode.name =
                        response.body.nodeinfo.name;
                    listNodeOperation.listNode.position =
                        response.body.nodeinfo.position;
                    listNodeOperation.operation = 'create';
                    this.refreshParent.emit(listNodeOperation);
                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
    }

    /**
     * called from the template any time the label changes.
     * Currently only implemented for labels because entering comments is not yet supported.
     *
     * @param data the data that was changed.
     */
    handleData(data: StringLiteral[]) {
        // this shouldn't run on the init...
        if (!this.initComponent) {
            this.labels = data;
        }
    }

    /**
     * show action bubble with various CRUD buttons when hovered over.
     */
    mouseEnter() {
        if (this.projectAdmin) {
            this.showActionBubble = true;
        }
    }

    /**
     * hide action bubble with various CRUD buttons when not hovered over.
     */
    mouseLeave() {
        this.showActionBubble = false;
    }

    /**
     * called when the 'edit' or 'delete' button is clicked.
     *
     * @param mode mode to tell DialogComponent which part of the template to show.
     * @param name label of the node; for now this is always the first label in the array.
     * @param iri iri of the node.
     */
    openDialog(mode: string, name: string, iri?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '640px',
            position: {
                top: '112px',
            },
            data: {
                mode: mode,
                title: mode === 'editListNode' || 'deleteListNode' ? name : '',
                id: iri,
                project: this.projectIri,
                projectUuid: this.projectUuid,
                parentIri: this.parentIri,
                position: this.position,
            },
        };

        // open the dialog box
        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe((data: ChildNodeInfo | boolean) => {
            // init data to emit to parent
            const listNodeOperation = new ListNodeOperation();

            if (mode === 'insertListNode' && data) {
                // the call to DSP-API to insert the new node is done in the child component
                listNodeOperation.listNode = data as ListNode;
                listNodeOperation.operation = 'insert';

                this.refreshParent.emit(listNodeOperation);
            } else if (mode === 'editListNode' && data) {
                // update
                // the call to DSP-API to update the node is done in the child component
                listNodeOperation.listNode = data as ListNode;
                listNodeOperation.operation = 'update';

                // emit data to parent to update the view
                this.refreshParent.emit(listNodeOperation);
                this.labels = (data as ChildNodeInfo).labels;
            } else if (
                mode === 'deleteListNode' &&
                typeof data === 'boolean' &&
                data === true
            ) {
                // delete
                // delete the node
                this._dspApiConnection.admin.listsEndpoint
                    .deleteListNode(iri)
                    .subscribe(
                        (response: ApiResponseData<DeleteListNodeResponse>) => {
                            listNodeOperation.listNode = response.body.node;
                            listNodeOperation.operation = 'delete';

                            // emit data to parent to update the view
                            this.refreshParent.emit(listNodeOperation);
                        },
                        (error: ApiResponseError) => {
                            // if DSP-API returns a 400, it is likely that the list node is in use so we inform the user of this
                            if (error.status === 400) {
                                const errorDialogConfig: MatDialogConfig = {
                                    width: '640px',
                                    position: {
                                        top: '112px',
                                    },
                                    data: { mode: 'deleteListNodeError' },
                                };

                                // open the dialog box
                                this._dialog.open(
                                    DialogComponent,
                                    errorDialogConfig
                                );
                            } else {
                                // use default error behavior
                                this._errorHandler.showMessage(error);
                            }
                        }
                    );
            }
        });
    }

    /**
     * called from the template when either of the two reposition buttons is clicked
     * @param direction in which direction the node should move
     */
    repositionNode(direction: 'up' | 'down') {
        const listNodeOperation = new ListNodeOperation();

        listNodeOperation.operation = 'reposition';
        listNodeOperation.listNode = new ListNode();

        // set desired node position
        if (direction === 'up') {
            listNodeOperation.listNode.position = this.position - 1;
        } else {
            listNodeOperation.listNode.position = this.position + 1;
        }

        listNodeOperation.listNode.id = this.iri;

        this.refreshParent.emit(listNodeOperation);
    }
}
