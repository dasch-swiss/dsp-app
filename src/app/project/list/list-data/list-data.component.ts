import { Component, OnInit, Input } from '@angular/core';
import { ListsService, ListNode, ApiServiceError, List } from '@knora/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material';

@Component({
    selector: 'app-list-data',
    templateUrl: './list-data.component.html',
    styleUrls: ['./list-data.component.scss']
})
export class ListDataComponent implements OnInit {

    loading: boolean;

    @Input() iri: string;

    list: ListNode;

    treeControl = new NestedTreeControl<ListNode>(node => node.children);
    dataSource = new MatTreeNestedDataSource<ListNode>();



    constructor (private _listsService: ListsService) { }

    ngOnInit() {

        this._listsService.getList(this.iri).subscribe(
            (result: List) => {
                console.log(result);
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
