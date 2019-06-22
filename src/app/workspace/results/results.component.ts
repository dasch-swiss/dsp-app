import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
    selector: 'app-results',
    templateUrl: './results.component.html',
    styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {

    searchQuery: string;
    searchMode: string;

    projectIri: string;

    constructor (private _route: ActivatedRoute,
        private _titleService: Title) {
        this._route.paramMap.subscribe((params: Params) => {
            // set the page title
            this._titleService.setTitle('Results found for "' + decodeURIComponent(params.get('q')) + '"');
        });
    }

    ngOnInit() {
    }

}
