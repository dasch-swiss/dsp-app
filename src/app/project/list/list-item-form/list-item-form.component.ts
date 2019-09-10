import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiServiceError, ListNode, ListNodeUpdatePayload, ListsService, StringLiteral } from '@knora/core';
import { AppGlobal } from 'src/app/app-global';

@Component({
    selector: 'app-list-item-form',
    templateUrl: './list-item-form.component.html',
    styleUrls: ['./list-item-form.component.scss']
})
export class ListItemFormComponent implements OnInit {

    loading: boolean;

    /**
     * node id, in case of edit item
     */
    @Input() iri?: string;

    /**
     * project shortcode
     */
    @Input() projectcode?: string;

    /**
     * parent node id
     */
    @Input() parentIri?: string;

    /**
     * list iri
     */
    // @Input() listIri?: string;

    @Input() labels?: StringLiteral[];

    // TODO: this is only used for the list creator prototype
    @Input() language?: string = 'en';

    @Output() refreshParent: EventEmitter<ListNode> = new EventEmitter<ListNode>();



    // labels: StringLiteral[];

    // @ViewChild('setFocus') labelInput: MatInput;

    placeholder: string = 'Append item to ';

    /**
    * form group for the form controller
    */
    form: FormGroup;

    updateData: boolean = false;

    constructor (
        private _formBuilder: FormBuilder,
        private _listsService: ListsService
    ) { }

    ngOnInit() {

        if (this.labels && this.labels.length > 0) {
            this.placeholder = 'Edit item ';
        }

        // TODO: get label of the parent node
        // it can be used in the input placeholder
        if (this.parentIri) {
            this._listsService.getListNodeInfo(this.parentIri).subscribe(
                (result: ListNode) => {
                    this.placeholder += result.labels[0].value;
                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );
        }

        // build form
        // this.buildForm();
    }

    submitData() {

        if (!this.labels.length) {
            return;
        }

        this.loading = true;

        // console.log('update data on node', this.iri);
        // console.log('update data', this.updateData);

        if (this.iri && this.updateData) {
            // edit mode
            // TODO: update node method not yet implemented; Waiting for Knora API

            // TODO: remove setTimeout after testing position of progress indicator
            setTimeout(() => {
                // console.log(this.resource);
                this.loading = false;
            }, 500);

        } else {

            // console.log(this.labels);
            // generate the data payload
            const listItem: ListNodeUpdatePayload = {
                parentNodeIri: this.parentIri,
                projectIri: AppGlobal.iriProjectsBase + this.projectcode,
                name: this.projectcode + '-' + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2),
                labels: this.labels,
                comments: []        // TODO: comment is not yet implemented
            };
            // send payload to knora's api
            this._listsService.createListItem(this.parentIri, listItem).subscribe(
                (result: ListNode) => {
                    this.refreshParent.emit(result);
                    // this.buildForm();
                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );
        }
    }

    handleData(data: StringLiteral[]) {

        // console.log('data from StringLiteral input', data);


        this.labels = data;
        if (data.length > 0) {
            // this.form.;
            // console.log('update node data', data);
        }
    }

    toggleBtn(show: boolean) {
        // console.log('show btn', show);
        this.updateData = show;


    }
}
