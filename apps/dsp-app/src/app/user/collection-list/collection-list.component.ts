import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-collection-list',
    templateUrl: './collection-list.component.html',
    styleUrls: ['./collection-list.component.scss'],
})
export class CollectionListComponent {
    loading = false;

    constructor(private _titleService: Title) {
        // set the page title
        this._titleService.setTitle('Your collections');
    }
}
