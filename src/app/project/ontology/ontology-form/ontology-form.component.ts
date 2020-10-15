import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, ProjectResponse, ReadProject, CreateOntology, OntologyMetadata } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, existingNamesValidator } from '@dasch-swiss/dsp-ui';
import { CacheService } from 'src/app/main/cache/cache.service';

export interface NewOntology {
    projectIri: string;
    name: string;
    label: string;
}

@Component({
    selector: 'app-ontology-form',
    templateUrl: './ontology-form.component.html',
    styleUrls: ['./ontology-form.component.scss']
})
export class OntologyFormComponent implements OnInit {

    loading: boolean;

    // project short code
    @Input() projectcode: string;

    // existing ontology names; name has to be unique
    @Input() existingOntologyNames: string[];

    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    @Output() updateParent: EventEmitter<string> = new EventEmitter<string>();

    project: ReadProject;

    ontologyForm: FormGroup;

    ontologyLabel: string = '';

    nameRegex = /^(?![vV][0-9]|[0-9]|[\u00C0-\u017F]).[a-zA-Z0-9]+\S*$/;

    forbiddenNames: string[] = [
        'knora',
        'salsah',
        'standoff',
        'ontology',
        'simple',
        'shared'
    ];

    existingNames: [RegExp];

    nameMinLength = 3;
    nameMaxLength = 16;

    formErrors = {
        'name': ''
    };

    validationMessages = {
        'name': {
            'required': 'Name is required.',
            'minlength': 'Name must be at least ' + this.nameMinLength + ' characters long.',
            'maxlength': 'Name cannot be more than ' + this.nameMaxLength + ' characters long.',
            'pattern': 'Name shouldn\'t start with a number or v + number and spaces or special characters are not allowed.',
            'existingName': 'This name is not allowed or exists already.'
        }
    };

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _fb: FormBuilder) { }

    ngOnInit() {

        this.loading = true;

        // set the cache
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode));

        // get project
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode)).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.project = response.body.project;

                this.buildForm();

                this.loading = false;
            },
            (error: ApiResponseError) => {
                console.error(error);
                this.loading = false;
            }
        );

    }

    buildForm() {

        // reset existing names
        this.existingNames = [
            new RegExp('anEmptyRegularExpressionWasntPossible')
        ];

        // get all project ontologies and read the name
        // name has to be unique; if it already exists
        // show an error message
        for (const name of this.existingOntologyNames) {
            this.existingNames.push(
                new RegExp('(?:^|W)' + name + '(?:$|W)')
            )
        }

        for (const name of this.forbiddenNames) {
            this.existingNames.push(
                new RegExp(name)
            );
        }

        this.ontologyLabel = this.project.shortname + ' data model: ';

        this.ontologyForm = this._fb.group({
            name: new FormControl({
                value: '', disabled: false
            }, [
                Validators.required,
                Validators.minLength(this.nameMinLength),
                Validators.maxLength(this.nameMaxLength),
                existingNamesValidator(this.existingNames),
                Validators.pattern(this.nameRegex)
            ]),
            label: new FormControl({
                value: this.ontologyLabel, disabled: true
            })
        });

        this.ontologyForm.valueChanges.subscribe(data => this.onValueChanged(data));
    }

    onValueChanged(data?: any) {

        if (!this.ontologyForm) {
            return;
        }

        this.ontologyLabel = this.project.shortname + ' data model: ' + data.name;

        Object.keys(this.formErrors).map(field => {
            this.formErrors[field] = '';
            const control = this.ontologyForm.get(field);
            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];
                Object.keys(control.errors).map(key => {
                    this.formErrors[field] += messages[key] + ' ';
                });

            }
        });

    }

    createOntology() {
        this.loading = true;

        // const something: number = Math.floor(Math.random() * Math.floor(9999));

        const ontologyData = new CreateOntology();
        ontologyData.label = this.ontologyLabel;
        ontologyData.name = this.ontologyForm.controls['name'].value;
        ontologyData.attachedToProject = this.project.id;

        this._dspApiConnection.v2.onto.createOntology(ontologyData).subscribe(
            (response: OntologyMetadata) => {
                this.updateParent.emit(response.id);
                this.closeDialog.emit(response.id);
            },
            (error: ApiResponseError) => {
                // in case of an error... e.g. because the ontolog iri is not unique, rebuild the form including the error message
                this.formErrors['name'] += this.validationMessages['name']['existingName'] + ' ';
                this.loading = false;

                console.error(error);
            }
        );
    }

    /**
     * Reset the form
     */
    resetForm(ev: Event, resourceClass?: any) {

        this.ontologyLabel = this.project.shortname + ' ontology (data model): ';

        this.buildForm();

    }



}
