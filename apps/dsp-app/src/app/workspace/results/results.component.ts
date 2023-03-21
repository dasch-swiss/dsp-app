import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import {
    FilteredResources,
    SearchParams,
} from './list-view/list-view.component';

export interface SplitSize {
    gutterNum: number;
    sizes: Array<number>;
}

@Component({
    selector: 'app-results',
    templateUrl: './results.component.html',
    styleUrls: ['./results.component.scss'],
})
export class ResultsComponent {
    searchParams: SearchParams;

    resIri: string;

    resourceIri: string;

    // display single resource or intermediate page in case of multiple selection
    viewMode: 'single' | 'intermediate' | 'compare' = 'single';

    // which resources are selected?
    selectedResources: FilteredResources;

    // search params
    searchQuery: string;
    searchMode: 'fulltext' | 'gravsearch';

    loading = true;

    splitSize: SplitSize;

    constructor(private _route: ActivatedRoute, private _titleService: Title) {
        this._route.paramMap.subscribe((params: Params) => {
            this.searchQuery = decodeURIComponent(params.get('q'));
            this.searchMode =
                decodeURIComponent(params.get('mode')) === 'fulltext'
                    ? 'fulltext'
                    : 'gravsearch';

            this.searchParams = {
                query: this.searchQuery,
                mode: this.searchMode,
            };
            // get the project iri if exists
            if (params.get('project')) {
                this.searchParams.filter = {
                    limitToProject: decodeURIComponent(params.get('project')),
                };
            }
        });

        // set the page title
        this._titleService.setTitle(
            'Search results for ' + this.searchParams.mode + ' search'
        );
    }

    onSelectionChange(res: FilteredResources) {
        this.selectedResources = res;
        this.resourceIri = this.selectedResources.resInfo[0]?.id;

        if (!res || res.count <= 1) {
            this.viewMode = 'single';
        } else {
            if (this.viewMode !== 'compare') {
                this.viewMode =
                    res && res.count > 0 ? 'intermediate' : 'single';
            }
        }
    }
}
