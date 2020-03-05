import { Component, Input, OnInit, Inject } from '@angular/core';
import { StringLiteral, KnoraApiConnection, ApiResponseData, ListResponse, ListNode, ApiResponseError } from '@knora/api';
import { KnoraApiConnectionToken } from '@knora/core';

@Component({
    selector: 'app-list-item',
    templateUrl: './list-item.component.html',
    styleUrls: ['./list-item.component.scss']
})
export class ListItemComponent implements OnInit {

    @Input() list: ListNode[];

    @Input() parentIri?: string;

    @Input() projectcode: string;

    @Input() projectIri: string;

    @Input() childNode: boolean;

    @Input() language?: string;

    expandedNode: string;

    loading: boolean;

    constructor(@Inject(KnoraApiConnectionToken) private knoraApiConnection: KnoraApiConnection) { }

    ngOnInit() {
        this.loading = true;

        // in case of child node: do not run the following request
        if (!this.childNode) {
            this.knoraApiConnection.admin.listsEndpoint.getList(this.parentIri).subscribe(
                (result: ApiResponseData<ListResponse>) => {
                    this.list = result.body.list.children;
                    this.language = result.body.list.listinfo.labels[0].language;

                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    console.error(error);
                }
            );
        }

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
