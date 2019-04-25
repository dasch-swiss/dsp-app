import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchParamsService, ExtendedSearchParams } from '@knora/core';
import { encodeUriQuery } from '@angular/router/src/url_tree';

@Component({
    selector: 'app-expert-search',
    templateUrl: './expert-search.component.html',
    styleUrls: ['./expert-search.component.scss']
})
export class ExpertSearchComponent implements OnInit {

    expertSearchForm: FormGroup;
    gravsearchQuery: string;
    route: string = "/search";

    constructor(
        private fb: FormBuilder,
        private _route: ActivatedRoute,
        private _router: Router,
        private _searchParamsService: SearchParamsService) { }

    ngOnInit() {
        this.expertSearchForm = this.fb.group({
            gravquery: [`
        select * where { 
          ?s ?p ?o .
        } limit 100
      `,
                Validators.required]
        })
    }

    submitQuery() {
        this.gravsearchQuery = this.generateGravsearch(0);
        console.log(encodeURIComponent(this.gravsearchQuery));
        this._router.navigate([this.route + '/extended/', this.gravsearchQuery]);
    }

    private generateGravsearch(offset: number = 0): string {

        const queryTemplate = this.expertSearchForm.controls['gravquery'].value;
        console.log('queryTemplate', queryTemplate);

        // offset component of the Gravsearch query
        const offsetTemplate = `
         OFFSET ${offset}
         `;

        // function that generates the same Gravsearch query with the given offset
        const generateGravsearchWithCustomOffset = (localOffset: number): string => {
            const offsetCustomTemplate = `
             OFFSET ${localOffset}
             `;

            return queryTemplate + offsetCustomTemplate;
        };

        if (offset === 0) {
            // store the function so another Gravsearch query can be created with an increased offset
            this._searchParamsService.changeSearchParamsMsg(new ExtendedSearchParams(generateGravsearchWithCustomOffset));
        }
        return queryTemplate + offsetTemplate;
    }
}
