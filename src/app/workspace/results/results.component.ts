import { Component, Inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { ApiResponseError, CountQueryResponse, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, FilteredResouces, NotificationService, SearchParams } from '@dasch-swiss/dsp-ui';

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

    // progress status
    loading = true;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _notification: NotificationService,
        private _route: ActivatedRoute,
        private _titleService: Title
    ) {

        this._route.paramMap.subscribe((params: Params) => {
            this.searchQuery = decodeURIComponent(params.get('q'));
            this.searchMode = (decodeURIComponent(params.get('mode')) === 'fulltext' ? 'fulltext' : 'gravsearch');

            this.checkResourceCount();

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

    // get the number of search results for given query
    checkResourceCount() {

        this.loading = true;

        if (this.searchMode === 'fulltext') {
            // perform count query
            this._dspApiConnection.v2.search.doFulltextSearchCountQuery(this.searchQuery).subscribe(
                (response: CountQueryResponse) => {
                    this.numberOfAllResults = response.numberOfResults;
                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    this._notification.openSnackBar(error);
                    this.loading = false;
                }
            );
        } else if (this.searchMode === 'gravsearch') {
            // search mode: gravsearch
            // perform count query
            this._dspApiConnection.v2.search.doExtendedSearchCountQuery(this.searchQuery).subscribe(
                (response: CountQueryResponse) => {
                    this.numberOfAllResults = response.numberOfResults;
                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    this._notification.openSnackBar(error);
                    this.loading = false;
                }
            );
        }
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
