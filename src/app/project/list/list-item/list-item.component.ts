import { Component, OnInit, Input } from '@angular/core';
import { ListNode, StringLiteral, ListsService, List, ApiServiceError } from '@knora/core';

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

    // TODO: this is only used for the list creator prototype
    @Input() language?: string = 'en';

    expandedNode: string;

    edit: boolean = false;

    // showChildren: boolean = false;

    constructor (private _listsService: ListsService) { }

    ngOnInit() {
        // console.log(this.list);
        // console.log(this.parentIri);
        this.loading = true;
        this._listsService.getList(this.parentIri).subscribe(
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

    editNode(label: StringLiteral[]) {

    }

}
