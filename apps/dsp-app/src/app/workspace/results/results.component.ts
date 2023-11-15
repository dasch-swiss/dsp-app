import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import {
    FilteredResources,
    SearchParams,
} from './list-view/list-view.component';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

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
        const parentParams$ = this._route.parent.paramMap;
        const params$ = this._route.paramMap;

        const combinedParams$ = combineLatest([parentParams$, params$]).pipe(
            map(([parentParams, params]) => {
                return {
                    parentParams: parentParams,
                    params: params,
                };
            })
        );

        combinedParams$.subscribe((data) => {
            const parentParams = data.parentParams;
            const params = data.params;

            this._handleParentParams(parentParams);
            this._handleSearchParams(params);

            this._titleService.setTitle(
                'Search results for ' + this.searchParams.mode + ' search'
            );
        });
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

    private _handleParentParams(parentParams: Params) {
        const uuid = parentParams.get('uuid');
        if (uuid) {
            this.searchParams = {
                query: '',
                mode: 'gravsearch'
            };
            this.searchParams.projectUuid = uuid;
        }
    }

    private _handleSearchParams(params: Params) {
        this.searchQuery = decodeURIComponent(params.get('q'));
        this.searchMode = decodeURIComponent(params.get('mode')) === 'fulltext' ? 'fulltext' : 'gravsearch';

        this.searchParams = {
            query: this.searchQuery,
            mode: this.searchMode,
        };

        if (params.get('project') && this.searchMode === 'fulltext') {
            this.searchParams.filter = {
                limitToProject: decodeURIComponent(params.get('project')),
            };
        }
    }
}
