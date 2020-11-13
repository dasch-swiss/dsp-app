import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-select-project',
    templateUrl: './select-project.component.html',
    styleUrls: ['./select-project.component.scss']
})
export class SelectProjectComponent implements OnInit, OnDestroy {

    @Input() formGroup: FormGroup;

    @Input() usersProjects: StoredProject[];

    @Output() projectSelected = new EventEmitter<string>();

    form: FormGroup;

    projectChangesSubscription: Subscription;

    constructor(@Inject(FormBuilder) private _fb: FormBuilder) { }

    ngOnInit(): void {

        // build a form for the named graph selection
        this.form = this._fb.group({
            projects: [null, Validators.required]
        });

        // emit Iri of the project when selected
        this.projectChangesSubscription = this.form.valueChanges.subscribe((data) => {
            this.projectSelected.emit(data.projects);
        });

        // add form to the parent form group
        this.formGroup.addControl('projects', this.form);

        // if there is only one project to choose from, select it automatically
        if (this.usersProjects.length === 1) {
            this.form.controls.projects.setValue(this.usersProjects[0].id);
        }

    }

    ngOnDestroy() {
        if (this.projectChangesSubscription !== undefined) {
            this.projectChangesSubscription.unsubscribe();
        }
    }

}
