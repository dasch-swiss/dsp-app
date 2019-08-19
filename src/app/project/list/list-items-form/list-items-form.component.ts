import { Component, Input, OnInit } from '@angular/core';
import { ApiServiceError, List, ListNode, ListsService } from '@knora/core';

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

    constructor (private _listsService: ListsService) {
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

    }

}
