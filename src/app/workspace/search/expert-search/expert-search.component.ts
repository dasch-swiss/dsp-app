import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SearchParams } from '@dasch-swiss/dsp-ui';
import { CacheService } from 'src/app/main/cache/cache.service';

@Component({
    selector: 'app-expert-search',
    templateUrl: './expert-search.component.html',
    styleUrls: ['./expert-search.component.scss']
})
export class ExpertSearchComponent implements OnInit {

    loading: boolean = true;

    gravsearchQuery: string;

    searchParams: SearchParams;

    constructor(
        private _cache: CacheService,
        private _titleService: Title,
        private _router: Router
    ) {
        this._titleService.setTitle('Expert search');
    }

    ngOnInit() {

        // TODO: find another solution
        /* if (this._cache.has('gravsearch')) {

            // reload the results
            this._cache.get('gravsearch').subscribe(
                (response: string) => {
                    this.searchParams = { query: response, mode: 'gravsearch' };
                },
                (error: any) => {
                    console.error(error);
                }
            );
        } */
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
