import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { FilteredResouces, SearchParams } from '@dasch-swiss/dsp-ui';

@Component({
    selector: 'app-results',
    templateUrl: './results.component.html',
    styleUrls: ['./results.component.scss']
})
export class ResultsComponent {

    searchParams: SearchParams;

    resIri: string;

    resourceIri: string;

    // display single resource or intermediate page in case of multiple selection
    multipleSelection = false;
    multipleResources: FilteredResouces;

    // number of all results
    numberOfAllResults: number;

    // search params
    searchQuery: string;
    searchMode: 'fulltext' | 'gravsearch';

    constructor(
        private _route: ActivatedRoute,
        private _titleService: Title
    ) {

        this._route.paramMap.subscribe((params: Params) => {
            this.searchQuery = decodeURIComponent(params.get('q'));
            this.searchMode = (decodeURIComponent(params.get('mode')) === 'fulltext' ? 'fulltext' : 'gravsearch');

            this.searchParams = {
                query: this.searchQuery,
                mode: this.searchMode
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

    openResource(id: string) {
        this.multipleSelection = false;
        this.multipleResources = undefined;
        this.resourceIri = id;
    }

    // this funtion is called when 'withMultipleSelection' is true and
    // multiple resources are selected for comparision
    openMultipleResources(resources: FilteredResouces) {

        this.multipleSelection = (resources && resources.count > 0);

        this.multipleResources = (this.multipleSelection ? resources : undefined);

    }

}
