import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTreeNestedDataSource } from '@angular/material';
import { ApiServiceError, ListNodeUpdatePayload, ListsService, ListNode, List } from '@knora/core';
import { AppGlobal } from 'src/app/app-global';

/**
 * Food data with nested structure.
 * Each node has a name and an optiona list of children.
 */
interface ListItem {
    name: string;
    children?: ListItem[];
}

const TREE_DATA: ListItem[] = [
    {
        name: 'Fruit',
        children: [
            { name: 'Apple' },
            { name: 'Banana' },
            { name: 'Fruit loops' },
        ]
    }, {
        name: 'Vegetables',
        children: [
            {
                name: 'Green',
                children: [
                    { name: 'Broccoli' },
                    { name: 'Brussel sprouts' },
                ]
            }, {
                name: 'Orange',
                children: [
                    { name: 'Pumpkins' },
                    { name: 'Carrots' },
                ]
            },
        ]
    },
];


@Component({
    selector: 'app-list-items-form',
    templateUrl: './list-items-form.component.html',
    styleUrls: ['./list-items-form.component.scss']
})
export class ListItemsFormComponent implements OnInit {


    @Input() iri?: string;

    @Input() projectcode?: string;

    list: ListNode[];

    treeControl = new NestedTreeControl<ListItem>(node => node.children);
    dataSource = new MatTreeNestedDataSource<ListItem>();

    /**
 * form group for the form controller
 */
    form: FormGroup;

    constructor (private _formBuilder: FormBuilder,
        private _listsService: ListsService) {
        this.dataSource.data = TREE_DATA;
    }

    hasChild = (_: number, node: ListItem) => !!node.children && node.children.length > 0;

    ngOnInit() {

        this._listsService.getList(this.iri).subscribe(
            (result: List) => {
                // console.log(result);
                this.list = result.children;
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
                    language: 'en'
                }
            ],
            comments: [
                {
                    value: this.form.controls['comment'].value,
                    language: 'en'
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
