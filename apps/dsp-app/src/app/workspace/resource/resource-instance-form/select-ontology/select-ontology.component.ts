import {
    AfterViewInit,
    Component,
    EventEmitter,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Output,
} from '@angular/core';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { OntologiesMetadata } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';

const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-select-ontology',
    templateUrl: './select-ontology.component.html',
    styleUrls: ['./select-ontology.component.scss'],
})
export class SelectOntologyComponent
    implements OnInit, OnDestroy, AfterViewInit
{
    @Input() formGroup: UntypedFormGroup;

    @Input() ontologiesMetadata: OntologiesMetadata;

    // optional input to provide the component with a pre-selected ontology
    @Input() selectedOntology?: string;

    @Output() ontologySelected = new EventEmitter<string>();

    form: UntypedFormGroup;

    ontologyChangesSubscription: Subscription;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    ngOnInit(): void {
        // build a form for the named graph selection
        this.form = this._fb.group({
            ontologies: [null, Validators.required],
        });

        // emit Iri of the project when selected
        this.ontologyChangesSubscription = this.form.valueChanges.subscribe(
            (data) => {
                this.ontologySelected.emit(data.ontologies);
            }
        );

        // check if there is a pre-selected ontology, if so, set the value of the form control to this value
        if (this.selectedOntology) {
            this.form.controls.ontologies.setValue(this.selectedOntology);
        }

        resolvedPromise.then(() => {
            // add form to the parent form group
            this.formGroup.addControl('ontologies', this.form);
        });
    }

    ngAfterViewInit() {
        // if there is only one ontology to choose from, select it automatically
        // more info: https://indepth.dev/everything-you-need-to-know-about-the-expressionchangedafterithasbeencheckederror-error
        if (this.ontologiesMetadata.ontologies.length === 1) {
            Promise.resolve(null).then(() =>
                this.form.controls.ontologies.setValue(
                    this.ontologiesMetadata.ontologies[0].id
                )
            );
        }
    }

    ngOnDestroy() {
        if (this.ontologyChangesSubscription !== undefined) {
            this.ontologyChangesSubscription.unsubscribe();
        }
    }
}
