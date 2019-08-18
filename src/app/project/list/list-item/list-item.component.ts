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

    }

    updateView(data: ListNode, firstNode: boolean = false) {

        this.loading = true;
        // update the view by updating the existing list
        if (firstNode) {
            // in case of new child node, we have to use the children from list
            const index: number = this.list.findIndex(item => item.id === this.expandedNode);
            this.list[index].children.push(data);

        } else {
            this.list.push(data);
        }

        data.children = [];

    }

}
