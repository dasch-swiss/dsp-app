import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ResourceClassDefinition } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';

const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-select-resource-class',
    templateUrl: './select-resource-class.component.html',
    styleUrls: ['./select-resource-class.component.scss']
})
export class SelectResourceClassComponent implements OnInit, OnDestroy {

    @Input() formGroup: FormGroup;

    @Input() resourceClassDefinitions: ResourceClassDefinition[];

    // optional input to provide the component with a pre-selected ResourceClassDefinition
    @Input() selectedResourceClass?: ResourceClassDefinition;

    // optional input to provide the component with a pre-chosen label
    @Input() chosenResourceLabel?: string;

    @Output() resourceClassSelected = new EventEmitter<string>();

    @Output() resourceLabel = new EventEmitter<string>();

    label: string;

    form: FormGroup;

    resourceChangesSubscription: Subscription;

    constructor(@Inject(FormBuilder) private _fb: FormBuilder) { }

    ngOnInit(): void {

        // build a form for the named graph selection
        this.form = this._fb.group({
            resources: [null, Validators.required],
            label: [null]
        });

        // emit Iri of the resource when selected
        this.resourceChangesSubscription = this.form.controls.resources.valueChanges.subscribe((data) => {
            this.resourceClassSelected.emit(data);
        });

        // emit label of the resource when selected
        this.resourceChangesSubscription = this.form.controls.label.valueChanges.subscribe((data) => {
            this.resourceLabel.emit(data);
        });

        // if there is only one Resource Class Definition to choose from, select it automatically
        if (this.resourceClassDefinitions.length === 1) {
            this.form.controls.resources.setValue(this.resourceClassDefinitions[0].id);
        }

        resolvedPromise.then(() => {
            // add form to the parent form group
            this.formGroup.addControl('resources', this.form);
        });

        // check if there is a pre-selected ResourceClassDefinition, if so, set the value of the form control to this value
        if (this.selectedResourceClass) {
            this.form.controls.resources.setValue(this.selectedResourceClass.id);
        }

        // check if there is a pre-chosen label, if so, set the value of the form control to this value
        if (this.chosenResourceLabel) {
            this.form.controls.label.setValue(this.chosenResourceLabel);
        }
    }

    ngOnDestroy() {
        if (this.resourceChangesSubscription !== undefined) {
            this.resourceChangesSubscription.unsubscribe();
        }
    }

}
