import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OntologiesMetadata } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';

const resolvedPromise = Promise.resolve(null);

@Component({
  selector: 'app-select-ontology',
  templateUrl: './select-ontology.component.html',
  styleUrls: ['./select-ontology.component.scss']
})
export class SelectOntologyComponent implements OnInit, OnDestroy {

    @Input() formGroup: FormGroup;

    @Input() ontologiesMetadata: OntologiesMetadata;

    // optional input to provide the component with a pre-selected ontology
    @Input() selectedOntology?: string;

    @Output() ontologySelected = new EventEmitter<string>();

    form: FormGroup;

    ontologyChangesSubscription: Subscription;

    constructor(@Inject(FormBuilder) private _fb: FormBuilder) { }

    ngOnInit(): void {

        // build a form for the named graph selection
        this.form = this._fb.group({
            ontologies: [null, Validators.required]
        });

        // emit Iri of the project when selected
        this.ontologyChangesSubscription = this.form.valueChanges.subscribe((data) => {
            this.ontologySelected.emit(data.ontologies);
        });

        // if there is only one ontology to choose from, select it automatically
        if (this.ontologiesMetadata.ontologies.length === 1) {
            this.form.controls.ontologies.setValue(this.ontologiesMetadata.ontologies[0].id);
        }

        resolvedPromise.then(() => {
            // add form to the parent form group
            this.formGroup.addControl('ontologies', this.form);
        });

        // check if there is a pre-selected ontology, if so, set the value of the form control to this value
        if (this.selectedOntology) {
            this.form.controls.ontologies.setValue(this.selectedOntology);
        }
    }

    ngOnDestroy() {
        if (this.ontologyChangesSubscription !== undefined) {
            this.ontologyChangesSubscription.unsubscribe();
        }
    }

}
