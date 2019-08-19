import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ApiServiceError, ListNode, ListNodeUpdatePayload, ListsService } from '@knora/core';
import { AppGlobal } from 'src/app/app-global';
import { MatInput } from '@angular/material';

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
    @Input() listIri?: string;

    // TODO: this is only used for the list creator prototype
    @Input() language?: string = 'en';

    @Output() refreshParent: EventEmitter<ListNode> = new EventEmitter<ListNode>();

    @ViewChild('setFocus') labelInput: MatInput;


    placeholder: string = 'Append item to ';

    /**
    * form group for the form controller
    */
    form: FormGroup;

    constructor (
        private _formBuilder: FormBuilder,
        private _listsService: ListsService
    ) { }

    ngOnInit() {

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
        this.buildForm();
    }

    buildForm() {
        this.form = this._formBuilder.group({
            hasRootNode: new FormControl(
                {
                    value: this.parentIri,
                    disabled: false
                }
            ),
            label: new FormControl(
                {
                    value: '',
                    disabled: false
                }
            ),
            comment: new FormControl(
                {
                    value: '',
                    disabled: false
                }
            )
        });

        // this.form.controls['label'].focus();

        this.loading = false;
    }

    submitData() {

        this.loading = true;

        if (this.iri) {
            // edit mode
            // TODO: not yet implemented
        } else {

            // generate the data payload
            const listItem: ListNodeUpdatePayload = {
                parentNodeIri: this.form.controls['hasRootNode'].value,
                projectIri: AppGlobal.iriProjectsBase + this.projectcode,
                name: this.projectcode + '-' + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2),
                labels: [
                    {
                        value: this.form.controls['label'].value,
                        language: this.language
                    }
                ],
                comments: [
                    {
                        value: this.form.controls['comment'].value,
                        language: this.language
                    }
                ]
            };
            // send payload to knora's api
            this._listsService.createListItem(this.form.controls['hasRootNode'].value, listItem).subscribe(
                (result: ListNode) => {
                    this.refreshParent.emit(result);
                    this.buildForm();
                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );
        }
    }

}
