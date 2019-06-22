import { Component, OnInit } from '@angular/core';
import { CacheService } from 'src/app/main/cache/cache.service';

@Component({
    selector: 'app-advanced-search',
    templateUrl: './advanced-search.component.html',
    styleUrls: ['./advanced-search.component.scss']
})
export class AdvancedSearchComponent implements OnInit {

    loading: boolean = true;

    gravsearchQuery: string;

    constructor (private _cache: CacheService) { }

    ngOnInit() {

        if (this._cache.has('gravsearch')) {
            // reload the results
            this._cache.get('gravsearch').subscribe(
                (cachedQuery: string) => {
                    this.gravsearchQuery = cachedQuery;
                    this.loading = false;
                },
                (error: any) => {
                    console.error(error);
                }
            );
        }
    }

    setGravsearch(query: string) {

        this.loading = true;

        this._cache.del('gravsearch');

        this._cache.set('gravsearch', query);

        this._cache.get('gravsearch').subscribe(
            (cachedQuery: string) => {
                // get cached query
                this.gravsearchQuery = cachedQuery;
            },
            (error: any) => {
                console.error(error);
            }
        );

        this.loading = false;

    }
}
