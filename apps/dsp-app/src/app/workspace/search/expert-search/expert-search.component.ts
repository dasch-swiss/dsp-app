import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import {
    AbstractControl,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { SearchParams } from '../../results/list-view/list-view.component';
import {
    GravsearchSearchParams,
    SearchParamsService,
} from '../services/search-params.service';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';

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
    styleUrls: ['./expert-search.component.scss'],
})
export class ExpertSearchComponent implements OnInit, AfterViewInit {
    /**
     * the data event emitter of type SearchParams
     *
     * @param  search
     */
    @Output() search = new EventEmitter<SearchParams>();

    @ViewChild('textArea') textAreaElement: ElementRef;

    expertSearchForm: UntypedFormGroup;
    queryFormControl: UntypedFormControl;

    iriBaseUrl = this._os.getIriBaseUrl();

    defaultGravsearchQuery = `PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
PREFIX webern: <${this.iriBaseUrl}/ontology/0806/webern-onto/v2#>

CONSTRUCT {
?s knora-api:isMainResource true .
?s webern:hasTitle ?title .

} WHERE {
?s a knora-api:Resource .
?s a webern:EditedText .
?s webern:hasTitle ?title .
}
`;

    constructor(
        private _os: OntologyService,
        private _searchParamsService: SearchParamsService,
        private _fb: UntypedFormBuilder,
        private _cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.queryFormControl = new UntypedFormControl(''
        );

        this.expertSearchForm = this._fb.group({
            gravsearchquery: [
                '',
                [Validators.required, forbiddenTermValidator(/OFFSET/i)],
            ],
        });
    }

    ngAfterViewInit() {
        if (this.textAreaElement?.nativeElement) {
            // focus the text area
            this.textAreaElement.nativeElement.focus();
            this._cdr.detectChanges();
        }
    }

    /**
     * reset the form to the initial state.
     */
    resetForm() {
        this.expertSearchForm.reset({
        });
        // focus the text area
        this.textAreaElement.nativeElement.focus();
    }

    /**
     * send the gravsearch query to the result view by emitting the gravsearch as an output.
     */
    submitQuery() {
        const gravsearch = this._generateGravsearch(0);

        if (gravsearch) {
            this.search.emit({
                query: gravsearch,
                mode: 'gravsearch',
            });
        }
    }

    /**
     * generate the whole gravsearch query matching the query given by the form.
     */
    private _generateGravsearch(offset = 0): string {
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
            this._searchParamsService.changeSearchParamsMsg(
                new GravsearchSearchParams(generateGravsearchWithCustomOffset)
            );
        }
        return query + offsetTemplate;
    }
}
