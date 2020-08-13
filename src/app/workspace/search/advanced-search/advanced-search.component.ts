import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SearchParams, AdvancedSearchParamsService, AdvancedSearchParams } from '@dasch-swiss/dsp-ui';


@Component({
    selector: 'app-advanced-search',
    templateUrl: './advanced-search.component.html',
    styleUrls: ['./advanced-search.component.scss']
})
export class AdvancedSearchComponent implements OnInit {

    loading: boolean = true;

    gravsearchQuery: string;

    searchParams: SearchParams;

    constructor(
        private _titleService: Title,
        private _router: Router
    ) {
        this._titleService.setTitle('Advanced search');
    }

    ngOnInit() {
        // TODO: if gravsearch query exists in the advanced-search cache (AdvancedSearchParamsService), get it and reload the results
        // otherwise empty (throw message)
    }

    doSearch(search: SearchParams) {
        // reset search params
        this.searchParams = undefined;
        // we can do the routing here or send the search param
        // to (resource) list view directly
        this.searchParams = search;
    }

    openResource(id: string) {
        this._router.navigate(['/resource/' + encodeURIComponent(id)]);
    }
}
