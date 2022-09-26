import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ResourceClassDefinition } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-search-select-resource-class',
    templateUrl: './search-select-resource-class.component.html',
    styleUrls: ['./search-select-resource-class.component.scss']
})
export class SearchSelectResourceClassComponent implements OnInit, OnChanges, OnDestroy {

    @Input() formGroup: UntypedFormGroup;

    @Input() resourceClassDefinitions: ResourceClassDefinition[];

    @Output() resourceClassSelected = new EventEmitter<string | null>();

    get selectedResourceClassIri(): string | false {
        if (this._selectedResourceClassIri !== undefined && this._selectedResourceClassIri !== null) {
            return this._selectedResourceClassIri;
        } else {
            return false;
        }
    }

    ontologyChangesSubscription: Subscription;

    form: UntypedFormGroup;

    // stores the currently selected resource class
    private _selectedResourceClassIri: string;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
    }

    ngOnInit(): void {
        this._initForm();

        // add form to the parent form group
        this.formGroup.addControl('resourceClass', this.form);
    }

    ngOnChanges(changes: SimpleChanges) {

        if (this.form !== undefined) {

            // resource classes have been reinitialized
            // reset form
            resolvedPromise.then(() => {

                // remove this form from the parent form group
                this.formGroup.removeControl('resourceClass');

                this._initForm();

                // add form to the parent form group
                this.formGroup.addControl('resourceClass', this.form);

            });

        }
    }

    ngOnDestroy() {
        this._closeOntologyChangesSubscription();
    }

    /**
     * initialises the FormGroup for the resource class selection.
     * The initial value is set to null.
     */
    private _initForm() {
        // build a form for the resource class selection
        this.form = this._fb.group({
            resourceClass: [null] // resource class selection is optional
        });

        // reset on updates of @Input resourceClassDefinitions
        this._selectedResourceClassIri = undefined;

        this._closeOntologyChangesSubscription();

        // store and emit Iri of the resource class when selected
        this.ontologyChangesSubscription = this.form.valueChanges.subscribe((data) => {
            this._selectedResourceClassIri = data.resourceClass;
            this.resourceClassSelected.emit(this._selectedResourceClassIri);
        });
    }

    /**
     * unsubscribe from form changes.
     */
    private _closeOntologyChangesSubscription() {
        if (this.ontologyChangesSubscription !== undefined) {
            this.ontologyChangesSubscription.unsubscribe();
        }
    }

}
