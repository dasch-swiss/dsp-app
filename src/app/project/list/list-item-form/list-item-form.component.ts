import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
    ApiResponseData,
    ApiResponseError,
    ChildNodeInfo,
    CreateChildNodeRequest,
    KnoraApiConnection,
    ListInfoResponse,
    ListNodeInfo,
    ListNodeInfoResponse,
    StringLiteral
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/dsp-ui';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';

@Component({
    selector: 'app-list-item-form',
    templateUrl: './list-item-form.component.html',
    styleUrls: ['./list-item-form.component.scss'],
    animations: [
        // the fade-in/fade-out animation.
        // https://www.kdechant.com/blog/angular-animations-fade-in-and-fade-out
        trigger('simpleFadeAnimation', [

          // the "in" style determines the "resting" state of the element when it is visible.
          state('in', style({opacity: 1})),

          // fade in when created.
          transition(':enter', [
            // the styles start from this point when the element appears
            style({opacity: 0}),
            // and animate toward the "in" state above
            animate(150)
          ]),

          // fade out when destroyed.
          transition(':leave',
            // fading out uses a different syntax, with the "style" being passed into animate()
            animate(150, style({opacity: 0})))
        ])
      ]
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

    showActionBubble: boolean = false;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: ErrorHandlerService,
        private _dialog: MatDialog
    ) { }

    ngOnInit() {

        this.initComponent = true;

        if (this.labels && this.labels.length > 0) {
            this.placeholder = 'Edit item ';
        }

        // it can be used in the input placeholder
        if (this.parentIri) {
            this._dspApiConnection.admin.listsEndpoint.getListNodeInfo(this.parentIri).subscribe(
                (response: ApiResponseData<ListNodeInfoResponse | ListInfoResponse>) => {
                    if (response.body instanceof ListInfoResponse) { // root node
                        this.placeholder += response.body.listinfo.labels[0].value;
                    } else { // child node
                        this.placeholder += response.body.nodeinfo.labels[0].value;
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
     * Called from the template when the plus button is clicked.
     * Sends the info to make a new child node to DSP-API and refreshes the UI to show the newly added node at the end of the list.
     */
    createChildNode() {

        if (!this.labels.length) {
            return;
        }

        this.loading = true;

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

        // send payload to dsp-api's api
        this._dspApiConnection.admin.listsEndpoint.createChildNode(listItem).subscribe(
            (response: ApiResponseData<ListNodeInfoResponse>) => {
                this.refreshParent.emit(response.body.nodeinfo);
                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

    /**
     * Called from the template any time the label changes.
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
     * Show action bubble with various CRUD buttons when hovered over.
     */
    mouseEnter() {
        this.showActionBubble = true;
    }

    /**
     * Hide action bubble with various CRUD buttons when not hovered over.
     */
    mouseLeave() {
        this.showActionBubble = false;
    }

    /**
     * Called when the 'edit' button is clicked.
     *
     * @param mode mode to tell DialogComponent which part of the template to show.
     * @param name label of the node; for now this is always the first label in the array.
     * @param iri iri of the node.
     */
    openDialog(mode: string, name: string, iri?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '640px',
            position: {
                top: '112px'
            },
            data: { mode: mode, title: name, id: iri, project: this.projectIri }
        };

        // open the dialog box
        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe((data: ChildNodeInfo) => {
            // update the view if data was passed back
            // data is only passed back when clicking the 'update' button
            if (data) {
                this.refreshParent.emit(data as ListNodeInfo);
                this.labels = data.labels;
            }
        });
    }
}
