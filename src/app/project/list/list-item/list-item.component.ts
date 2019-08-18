import { Component, OnInit, Input } from '@angular/core';
import { ListNode } from '@knora/core';

@Component({
    selector: 'app-list-item',
    templateUrl: './list-item.component.html',
    styleUrls: ['./list-item.component.scss']
})
export class ListItemComponent implements OnInit {

    loading: boolean;

    @Input() list: ListNode[];

    @Input() parentIri?: string;

    @Input() listIri: string;

    @Input() projectcode: string;

    expandedNode: string;

    // showChildren: boolean = false;

    constructor () { }

    ngOnInit() {
        // console.log(this.list);
        // console.log(this.parentIri);
    }

    showChildren(id: string): boolean {
        return (id === this.expandedNode);
    }

    toggleChildren(id: string) {

        if (this.showChildren(id)) {
            this.expandedNode = undefined;
        } else {
            this.expandedNode = id;
        }

        console.log(id);
        // this.showChildren = !this.showChildren;

    }

    updateView(data: ListNode) {
        this.loading = true;
        data.children = [];
        this.list.push(data);
        console.log('update list', this.list);
        console.log('with new node?', data);
        this.loading = false;


    }

}
