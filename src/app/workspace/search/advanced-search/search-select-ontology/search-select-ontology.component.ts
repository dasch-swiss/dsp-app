import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OntologiesMetadata } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-search-select-ontology',
    templateUrl: './search-select-ontology.component.html',
    styleUrls: ['./search-select-ontology.component.scss']
})
export class SearchSelectOntologyComponent implements OnInit, OnDestroy {

    @Input() formGroup: FormGroup;

    @Input() ontologiesMetadata: OntologiesMetadata;

    @Output() ontologySelected = new EventEmitter<string>();

    form: FormGroup;

    ontologyChangesSubscription: Subscription;

    constructor(@Inject(FormBuilder) private _fb: FormBuilder) {
    }

    ngOnInit() {

        // build a form for the named graph selection
        this.form = this._fb.group({
            ontologies: [null, Validators.required]
        });

        // emit Iri of the ontology when selected
        this.ontologyChangesSubscription = this.form.valueChanges.subscribe((data) => {
            this.ontologySelected.emit(data.ontologies);
        });

        // add form to the parent form group
        this.formGroup.addControl('ontologies', this.form);

    }

    ngOnDestroy() {
        if (this.ontologyChangesSubscription !== undefined) {
            this.ontologyChangesSubscription.unsubscribe();
        }
    }

}
