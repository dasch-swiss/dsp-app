import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
    SearchParamsService,
    ExtendedSearchParams,
    SearchService
} from '@knora/core';

@Component({
    selector: 'app-expert-search',
    templateUrl: './expert-search.component.html',
    styleUrls: ['./expert-search.component.scss']
})
export class ExpertSearchComponent {

    gravsearchQuery: string;

    constructor() { }

    /**
     * Submit the gravsearch query.
     */
    setGravsearch(query: string) {
        this.gravsearchQuery = query;
    }

}
