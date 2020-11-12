import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ResourceClassDefinition } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-select-resource-class',
    templateUrl: './select-resource-class.component.html',
    styleUrls: ['./select-resource-class.component.scss']
})
export class SelectResourceClassComponent implements OnInit, OnDestroy {

    @Input() formGroup: FormGroup;

    @Input() resourceClassDefinitions: ResourceClassDefinition[];

    @Output() resourceClassSelected = new EventEmitter<string>();

    @Output() resourceLabel = new EventEmitter<string>();

    label: string;

    form: FormGroup;

    resourceChangesSubscription: Subscription;

    constructor(@Inject(FormBuilder) private _fb: FormBuilder) { }

    ngOnInit(): void {

        // build a form for the named graph selection
        this.form = this._fb.group({
            resources: ['null', Validators.required],
            label: ['']
        });

        // emit Iri of the resource when selected
        this.resourceChangesSubscription = this.form.valueChanges.subscribe((data) => {
            this.resourceClassSelected.emit(data.resources);
        });

        // emit label of the resource when selected
        this.resourceChangesSubscription = this.form.valueChanges.subscribe((data) => {
            this.resourceLabel.emit(data.label);
        });

        // add form to the parent form group
        this.formGroup.addControl('resources', this.form);
        this.formGroup.addControl('label', this.form);
    }

    ngOnDestroy() {
        if (this.resourceChangesSubscription !== undefined) {
            this.resourceChangesSubscription.unsubscribe();
        }
    }

}
