import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { SearchParams } from '@dasch-swiss/dsp-ui';

@Component({
    selector: 'app-results',
    templateUrl: './results.component.html',
    styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {

    searchParams: SearchParams;

    resIri: string;

    resourceIri: string;

    constructor(
        private _route: ActivatedRoute,
        private _titleService: Title
    ) {

        this._route.paramMap.subscribe((params: Params) => {
            this.searchParams = {
                query: decodeURIComponent(params.get('q')),
                mode: (decodeURIComponent(params.get('mode')) === 'fulltext' ? 'fulltext' : 'gravsearch')
            };
            // get the project iri if exists
            if (params.get('project')) {
                this.searchParams.filter = {
                    limitToProject: decodeURIComponent(params.get('project'))
                };
            }

        });

        // set the page title
        this._titleService.setTitle('Search results for ' + this.searchParams.mode + ' search');
    }

    ngOnInit() {
    }

    openResource(id: string) {
        this.resourceIri = id;
    }

}
