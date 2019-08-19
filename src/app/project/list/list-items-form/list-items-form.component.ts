import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ApiServiceError, List, ListNode, ListNodeUpdatePayload, ListsService } from '@knora/core';
import { AppGlobal } from 'src/app/app-global';

@Component({
    selector: 'app-list-items-form',
    templateUrl: './list-items-form.component.html',
    styleUrls: ['./list-items-form.component.scss']
})
export class ListItemsFormComponent implements OnInit {

    loading: boolean;

    @Input() iri?: string;

    @Input() projectcode?: string;

    // TODO: this is only used for the list creator prototype
    @Input() language?: string = 'en';

    list: ListNode[];

    /**
    * form group for the form controller
    */
    form: FormGroup;

    constructor (private _formBuilder: FormBuilder,
        private _listsService: ListsService) {
    }

    ngOnInit() {

        this.loading = true;
        this._listsService.getList(this.iri).subscribe(
            (result: List) => {
                this.list = result.children;
                this.language = result.listinfo.labels[0].language;
                this.loading = false;
                //                this.list = result;
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        );

        // build form
        this.form = this._formBuilder.group({
            hasRootNode: new FormControl(
                {
                    value: this.iri,
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
    }

    submitData() {

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
        // send to the api
        this._listsService.createListItem(this.iri, listItem).subscribe(
            (result: ListNode) => {
                console.log('success? ', result);
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        );

        console.log(
            listItem
        );
    }

}
