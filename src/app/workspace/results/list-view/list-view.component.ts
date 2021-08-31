import { Component, EventEmitter, Inject, Input, OnChanges, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ApiResponseError, CountQueryResponse, IFulltextSearchParams, KnoraApiConnection, ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { NotificationService } from 'src/app/main/services/notification.service';
import { AdvancedSearchParamsService } from '../../../search/services/advanced-search-params.service';

/**
 * query: search query. It can be gravserch query or fulltext string query.
 * The query value is expected to have at least length of 3 characters.
 *
 * mode: search mode "fulltext" OR "gravsearch"
 *
 * filter: Optional fulltext search parameter with following (optional) properties:
 *   - limitToResourceClass: string; Iri of resource class the fulltext search is restricted to, if any.
 *   - limitToProject: string; Iri of the project the fulltext search is restricted to, if any.
 *   - limitToStandoffClass: string; Iri of standoff class the fulltext search is restricted to, if any.
 */
export interface SearchParams {
    query: string;
    mode: 'fulltext' | 'gravsearch';
    filter?: IFulltextSearchParams;
}

export interface ShortResInfo {
    id: string;
    label: string;
}

/* return the selected resources in below format
 *
 * count: total number of resources selected
 * selectedIds: list of selected resource's ids
 */
export interface FilteredResources {
    count: number;
    resListIndex: number[];
    resInfo: ShortResInfo[];
    selectionType: 'multiple' | 'single';
}

/* return the checkbox value
 *
 * checked: checkbox value
 * resIndex: resource index from the list
 */
export interface CheckboxUpdate {
    checked: boolean;
    resIndex: number;
    resId: string;
    resLabel: string;
    isCheckbox: boolean;
}

@Component({
    selector: 'app-list-view',
    templateUrl: './list-view.component.html',
    styleUrls: ['./list-view.component.scss']
})
export class ListViewComponent implements OnChanges {

    @Input() search: SearchParams;

    @Input() view?: 'list' | 'grid' = 'list';    // todo: will be expanded with 'table' as soon as resource-table component is done

    @Input() displayViewSwitch?: boolean = true;

    /**
     * set to true if multiple resources can be selected for comparison
     */
    @Input() withMultipleSelection?: boolean = false;

    /**
     * emits the selected resources 1-n
     */
    @Output() selectedResources: EventEmitter<FilteredResources> = new EventEmitter<FilteredResources>();

    /**
     * @deprecated Use selectedResources instead
     *
     * Click on checkbox will emit the resource info
     *
     * @param {EventEmitter<FilteredResources>} resourcesSelected
     */
    @Output() multipleResourcesSelected?: EventEmitter<FilteredResources> = new EventEmitter<FilteredResources>();

    /**
     * @deprecated Use selectedResources instead
     *
     * Click on an item will emit the resource iri
     *
     * @param {EventEmitter<string>} singleResourceSelected
     */
    @Output() singleResourceSelected?: EventEmitter<string> = new EventEmitter<string>();

    /**
     * @deprecated Use selectedResources instead.
     * Click on an item will emit the resource iri
     */
    @Output() resourceSelected: EventEmitter<string> = new EventEmitter<string>();

    resources: ReadResourceSequence;

    selectedResourceIdx: number[] = [];

    resetCheckBoxes = false;

    // matPaginator Output
    pageEvent: PageEvent;

    // number of all results
    numberOfAllResults: number;

    // progress status
    loading = true;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _advancedSearchParamsService: AdvancedSearchParamsService,
        private _notification: NotificationService
    ) { }

    ngOnChanges(): void {
        // reset
        this.pageEvent = new PageEvent();
        this.pageEvent.pageIndex = 0;
        this.resources = undefined;

        this._doSearch();
    }

    /**
     *
     * @param view 'list' | ' grid'; TODO: will be expanded with 'table' as soon as resource-table component is done
     */
    toggleView(view: 'list' | 'grid') {
        this.view = view;
    }

    // the child component send the selected resources to the parent of this component directly;
    // but when this component is intialized, it should select the first item in the list and
    // emit this selected resource to the parent.
    emitSelectedResources(res?: FilteredResources) {

        if (!res || res.count === 0) {
            // no resource is selected: In case of an error or no search results
            this.selectedResources.emit({ count: 0, resListIndex: [], resInfo: [], selectionType: 'single' });
        } else if (res.count > 0) {
            this.selectedResourceIdx = res.resListIndex;
            this.selectedResources.emit(res);
            this.resourceSelected.emit(res.resInfo[0].id);
        }


    }

    goToPage(page: PageEvent) {
        this.pageEvent = page;
        this._doSearch();
    }


    /**
     * do the search and send the resources to the child components
     * like resource-list, resource-grid or resource-table
     */
    private _doSearch() {

        this.loading = true;

        if (this.search.mode === 'fulltext') {
            // search mode: fulltext
            if (this.pageEvent.pageIndex === 0) {
                // perform count query
                this._dspApiConnection.v2.search.doFulltextSearchCountQuery(this.search.query, this.pageEvent.pageIndex, this.search.filter).subscribe(
                    (count: CountQueryResponse) => {
                        this.numberOfAllResults = count.numberOfResults;

                        if (this.numberOfAllResults === 0) {
                            this.emitSelectedResources();
                            this.resources = undefined;
                            this.loading = false;
                        }
                    },
                    (countError: ApiResponseError) => {
                        this._notification.openSnackBar(countError);
                    }
                );
            }

            // perform full text search
            this._dspApiConnection.v2.search.doFulltextSearch(this.search.query, this.pageEvent.pageIndex, this.search.filter).subscribe(
                (response: ReadResourceSequence) => {
                    // if the response does not contain any resources even the search count is greater than 0,
                    // it means that the user does not have the permissions to see anything: emit an empty result
                    if (response.resources.length === 0) {
                        this.emitSelectedResources();
                    }
                    this.resources = response;
                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    this._notification.openSnackBar(error);
                    this.resources = undefined;
                    this.loading = false;
                }
            );

        } else if (this.search.mode === 'gravsearch') {

            // search mode: gravsearch
            if (this.pageEvent.pageIndex === 0) {
                // perform count query
                this._dspApiConnection.v2.search.doExtendedSearchCountQuery(this.search.query).subscribe(
                    (count: CountQueryResponse) => {
                        this.numberOfAllResults = count.numberOfResults;

                        if (this.numberOfAllResults === 0) {
                            this.emitSelectedResources();
                            this.resources = undefined;
                            this.loading = false;
                        }
                    },
                    (countError: ApiResponseError) => {
                        this._notification.openSnackBar(countError);
                    }
                );
            }

            // perform advanced search
            const gravsearch = this._advancedSearchParamsService.getSearchParams().generateGravsearch(this.pageEvent.pageIndex);

            if (typeof gravsearch === 'string') {
                this._dspApiConnection.v2.search.doExtendedSearch(gravsearch).subscribe(
                    (response: ReadResourceSequence) => {
                        // if the response does not contain any resources even the search count is greater than 0,
                        // it means that the user does not have the permissions to see anything: emit an empty result
                        if (response.resources.length === 0) {
                            this.emitSelectedResources();
                        }
                        this.resources = response;
                        this.loading = false;
                    },
                    (error: ApiResponseError) => {
                        this._notification.openSnackBar(error);
                        this.resources = undefined;
                        this.loading = false;
                    }
                );
            } else {
                console.error('The gravsearch query is not set correctly');
                this.resources = undefined;
                this.loading = false;
            }

        }

    }
}
