import { CacheService } from 'src/app/main/cache/cache.service';

import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-expert-search',
    templateUrl: './expert-search.component.html',
    styleUrls: ['./expert-search.component.scss']
})
export class ExpertSearchComponent implements OnInit {

    loading: boolean = true;

    gravsearchQuery: string;

    constructor(private _cache: CacheService,
        private _titleService: Title) {
        this._titleService.setTitle('Expert search');
    }

    ngOnInit() {

        if (this._cache.has('gravsearch')) {

            // reload the results
            this._cache.get('gravsearch').subscribe(
                (response: string) => {
                    this.gravsearchQuery = response;
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
            (response: string) => {
                // get cached query
                this.gravsearchQuery = response;
            },
            (error: any) => {
                console.error(error);
            }
        );

        this.loading = false;

    }

}
