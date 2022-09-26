import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { OntologyService } from 'src/app/project/ontology/ontology.service';
import { SearchParams } from '../../results/list-view/list-view.component';
import { AdvancedSearchParams, AdvancedSearchParamsService } from '../services/advanced-search-params.service';

/**
 * validator checking that the query does not contain a certain term, here OFFSET
 *
 * @param {RegExp} termRe
 */
export function forbiddenTermValidator(termRe: RegExp): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        const forbidden = termRe.test(control.value);
        return forbidden ? { forbiddenName: { value: control.value } } : null;
    };
}

@Component({
    selector: 'app-expert-search',
    templateUrl: './expert-search.component.html',
    styleUrls: ['./expert-search.component.scss']
})
export class ExpertSearchComponent implements OnInit {

    /**
     * the data event emitter of type SearchParams
     *
     * @param  search
     */
    @Output() search = new EventEmitter<SearchParams>();

    expertSearchForm: UntypedFormGroup;
    queryFormControl: UntypedFormControl;

    iriBaseUrl = this._os.getIriBaseUrl();

    defaultGravsearchQuery =
    `PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
PREFIX incunabula: <${this.iriBaseUrl}/ontology/0803/incunabula/v2#>

CONSTRUCT {
    ?book knora-api:isMainResource true .
    ?book incunabula:title ?title .

} WHERE {
    ?book a incunabula:book .
    ?book incunabula:title ?title .
}
`;

    constructor(
        private _os: OntologyService,
        private _searchParamsService: AdvancedSearchParamsService,
        private _fb: UntypedFormBuilder
    ) { }

    ngOnInit(): void {
        // initialize the form with predefined Gravsearch query as example.
        this.queryFormControl = new UntypedFormControl(this.defaultGravsearchQuery);

        this.expertSearchForm = this._fb.group({
            gravsearchquery: [
                this.defaultGravsearchQuery,
                [
                    Validators.required,
                    forbiddenTermValidator(/OFFSET/i)
                ]
            ]
        });
    }

    /**
     * reset the form to the initial state.
     */
    resetForm() {
        this.expertSearchForm.reset({ gravsearchquery: this.defaultGravsearchQuery });
    }

    /**
     * send the gravsearch query to the result view by emitting the gravsearch as an output.
     */
    submitQuery() {
        const gravsearch = this._generateGravsearch(0);

        if (gravsearch) {
            this.search.emit({
                query: gravsearch,
                mode: 'gravsearch'
            });
        }
    }

    /**
     * generate the whole gravsearch query matching the query given by the form.
     */
    private _generateGravsearch(offset: number = 0): string {
        const query = this.expertSearchForm.controls['gravsearchquery'].value;

        // offset component of the Gravsearch query
        const offsetTemplate = `
         OFFSET ${offset}
         `;

        // function that generates the same Gravsearch query with the given offset
        const generateGravsearchWithCustomOffset = (
            localOffset: number
        ): string => {
            const offsetCustomTemplate = `
             OFFSET ${localOffset}
             `;

            return query + offsetCustomTemplate;
        };

        if (offset === 0) {
            // store the function so another Gravsearch query can be created with an increased offset
            this._searchParamsService.changeSearchParamsMsg(new AdvancedSearchParams(generateGravsearchWithCustomOffset));
        }
        return query + offsetTemplate;
    }

}
