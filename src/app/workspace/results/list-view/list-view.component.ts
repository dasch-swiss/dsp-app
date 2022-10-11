import { Component, EventEmitter, Inject, Input, OnChanges, OnInit, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ApiResponseError, CountQueryResponse, IFulltextSearchParams, KnoraApiConnection, ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { ComponentCommunicationEventService, EmitEvent, Events } from 'src/app/main/services/component-communication-event.service';
import { NotificationService } from 'src/app/main/services/notification.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

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
export class ListViewComponent implements OnChanges, OnInit {

    @Input() search: SearchParams;

    /**
     * set to true if multiple resources can be selected for comparison
     */
    @Input() withMultipleSelection?: boolean = false;

    /**
     * emits the selected resources 1-n
     */
    @Output() selectedResources: EventEmitter<FilteredResources> = new EventEmitter<FilteredResources>();

    resources: ReadResourceSequence;

    selectedResourceIdx: number[] = [];

    componentCommsSubscriptions: Subscription[] = [];

    resetCheckBoxes = false;

    // matPaginator Output
    pageEvent: PageEvent;

    // number of all results
    numberOfAllResults: number;

    // progress status
    loading = true;

    // feature toggle for new concept
    beta = false;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _componentCommsService: ComponentCommunicationEventService,
        private _errorHandler: ErrorHandlerService,
        private _notification: NotificationService,
        private _route: ActivatedRoute
    ) {

        // get feature toggle information if url contains beta
        this.beta = (this._route.parent.snapshot.url[0].path === 'beta');
        if (this.beta) {
            console.warn('This is a pre-released (beta) search results view');
        }
    }

    ngOnInit(): void {
        this.componentCommsSubscriptions.push(this._componentCommsService.on(
            Events.resourceDeleted, () => {
                this._doSearch();
            }
        ));
    }

    ngOnChanges(): void {
        // reset
        this.pageEvent = new PageEvent();
        this.pageEvent.pageIndex = 0;
        this.resources = undefined;
        this.emitSelectedResources();

        this._doSearch();
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
                        this.loading = countError.status !== 504;
                        this._errorHandler.showMessage(countError);
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
                    this.loading = false;
                    this.resources = undefined;
                    this._errorHandler.showMessage(error);
                }
            );

        } else if (this.search.mode === 'gravsearch') {
            // emit 'gravSearchExecuted' event to the fulltext-search component in order to clear the input field
            this._componentCommsService.emit(new EmitEvent(Events.gravSearchExecuted, true));

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
                        this.loading = countError.status !== 504;
                        this._errorHandler.showMessage(countError);
                    }
                );
            }

            let gravsearch: string;

            if (this.search.query !== undefined) {
                gravsearch = this.search.query;
                gravsearch = gravsearch.substring(0, gravsearch.search('OFFSET'));
                gravsearch = gravsearch + 'OFFSET ' + this.pageEvent.pageIndex;
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
                        this.loading = false;
                        this.resources = undefined;
                        this._errorHandler.showMessage(error);
                    }
                );
            } else {
                this._notification.openSnackBar('The gravsearch query is not set correctly');
                this.resources = undefined;
                this.loading = false;
            }

        }

    }
}
