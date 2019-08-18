import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Input, OnInit } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material';
import { ApiServiceError, List, ListNode, ListsService } from '@knora/core';

@Component({
    selector: 'app-list-items',
    templateUrl: './list-items.component.html',
    styleUrls: ['./list-items.component.scss']
})
export class ListItemsComponent implements OnInit {

    loading: boolean;

    @Input() iri: string;

    @Input() projectcode?: string;

    list: ListNode;

    treeControl = new NestedTreeControl<ListNode>(node => node.children);
    dataSource = new MatTreeNestedDataSource<ListNode>();

    constructor (private _listsService: ListsService) { }

    ngOnInit() {

        this._listsService.getList(this.iri).subscribe(
            (result: List) => {
                // console.log(result);
                this.dataSource.data = result.children;
                //                this.list = result;
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        );

    }

    hasChild = (_: number, node: ListNode) => !!node.children && node.children.length > 0;

}
