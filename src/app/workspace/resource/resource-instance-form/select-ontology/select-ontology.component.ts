import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { OntologiesMetadata } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-select-ontology',
  templateUrl: './select-ontology.component.html',
  styleUrls: ['./select-ontology.component.scss']
})
export class SelectOntologyComponent implements OnInit, OnDestroy {

    @Input() formGroup: FormGroup;

    @Input() ontologiesMetadata: OntologiesMetadata;

    @Output() ontologySelected = new EventEmitter<string>();

    form: FormGroup;

    ontologyChangesSubscription: Subscription;

    constructor(@Inject(FormBuilder) private _fb: FormBuilder) { }

    ngOnInit(): void {

        // build a form for the named graph selection
        this.form = this._fb.group({
            ontologies: ['null, Validators.required']
        });

        // emit Iri of the project when selected
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
