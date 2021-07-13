import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
    ApiResponseError,
    CreateOntology,
    KnoraApiConnection,
    OntologyMetadata,
    ReadOntology,
    ReadProject,
    UpdateOntologyMetadata
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, existingNamesValidator } from '@dasch-swiss/dsp-ui';
import { CacheService } from 'src/app/main/cache/cache.service';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';
import { OntologyService } from '../ontology.service';

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

    // project short code
    @Input() projectCode: string;

    // ontology iri in case of edit
    @Input() iri: string;

    // existing ontology names; name has to be unique
    @Input() existingOntologyNames: string[];

    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    @Output() updateParent: EventEmitter<string> = new EventEmitter<string>();

    loading: boolean;

    project: ReadProject;

    ontologyForm: FormGroup;

    ontologyLabel: string;
    ontologyComment: string;

    lastModificationDate: string;

    // regex to check ontology name: shouldn't start with a number or with 'v' followed by a number, spaces or special characters are not allowed
    nameRegex = /^(?![vV]+[0-9])+^([a-zA-Z])[a-zA-Z0-9]*$/;

    // ontology name must not contain one of the following words
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
        'name': '',
        'label': ''
    };

    validationMessages = {
        'name': {
            'required': 'Name is required.',
            'minlength': 'Name must be at least ' + this.nameMinLength + ' characters long.',
            'maxlength': 'Name cannot be more than ' + this.nameMaxLength + ' characters long.',
            'pattern': 'Name shouldn\'t start with a number or v + number and spaces or special characters are not allowed.',
            'existingName': 'This name is not allowed or exists already.'
        },
        'label': {
            'required': 'Label is required.',
            'minlength': 'Label must be at least ' + this.nameMinLength + ' characters long.',
        }
    };

    ontologyNameInfo = `
    The unique name
        - must be at least 3 characters long
        - shouldn't begin with a number
        - shouldn't begin with the letter v and a number
        - spaces or special characters are not allowed
        - may not contain these reserved words: knora, ontology, salsah, shared, simple or standoff
        - can't be changed afterwards
    `;

    error = false;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _fb: FormBuilder,
        private _ontologyService: OntologyService
    ) { }

    ngOnInit() {

        this.loading = true;

        this._cache.get(this.projectCode).subscribe(
            (response: ReadProject) => {
                this.project = response;
                this.buildForm();

                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
                this.loading = false;
            }
        );

        if (this.iri) {
            // edit mode: get current ontology
            this._cache.get('currentOntology').subscribe(
                (response: ReadOntology) => {
                    // add values to the ontology form
                    this.ontologyForm.controls['name'].disable();
                    const name = this._ontologyService.getOntologyName(this.iri);
                    this.ontologyForm.controls['name'].setValue(name);
                    this.ontologyForm.controls['label'].setValue(response.label);
                    this.ontologyForm.controls['label'].setValidators(
                        [Validators.required]
                    );
                    this.ontologyForm.controls['comment'].setValue(response.comment);
                    // disable name input

                    this.lastModificationDate = response.lastModificationDate;
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
        }

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
            );
        }

        for (const name of this.forbiddenNames) {
            this.existingNames.push(
                new RegExp(name)
            );
        }

        this.ontologyLabel = '';

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
                value: this.ontologyLabel, disabled: false
            }, [
                Validators.minLength(this.nameMinLength)
            ]),
            comment: new FormControl({
                value: this.ontologyComment, disabled: false
            })
        });

        this.ontologyForm.valueChanges.subscribe(data => this.onValueChanged(data));
    }

    onValueChanged(data?: any) {

        if (!this.ontologyForm) {
            return;
        }

        if (!this.iri) {
            this.ontologyLabel = this.capitalizeFirstLetter(data.name);
        }

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

    submitData() {
        this.loading = true;

        if (this.iri) {
            // edit mode
            const ontologyData = new UpdateOntologyMetadata();
            ontologyData.id = this.iri;
            ontologyData.lastModificationDate = this.lastModificationDate;
            ontologyData.label = this.ontologyForm.controls['label'].value;
            ontologyData.comment = this.ontologyForm.controls['comment'].value;

            this._dspApiConnection.v2.onto.updateOntology(ontologyData).subscribe(
                (response: OntologyMetadata) => {
                    this.updateParent.emit(response.id);
                    this.loading = false;
                    this.closeDialog.emit(response.id);
                },
                (error: ApiResponseError) => {
                    // in case of an error
                    this.loading = false;
                    this.error = true;

                    this._errorHandler.showMessage(error);
                }
            );

        } else {
            // create mode

            const ontologyData = new CreateOntology();
            ontologyData.label = this.project.shortname + ': ' + (this.ontologyLabel ? this.ontologyLabel : this.ontologyForm.controls['name'].value);
            ontologyData.name = this.ontologyForm.controls['name'].value;
            ontologyData.comment = this.ontologyForm.controls['comment'].value;
            ontologyData.attachedToProject = this.project.id;

            this._dspApiConnection.v2.onto.createOntology(ontologyData).subscribe(
                (response: OntologyMetadata) => {
                    this.updateParent.emit(response.id);
                    this.loading = false;
                    this.closeDialog.emit(response.id);
                },
                (error: ApiResponseError) => {
                    // in case of an error... e.g. because the ontolog iri is not unique, rebuild the form including the error message
                    this.formErrors['name'] += this.validationMessages['name']['existingName'] + ' ';
                    this.loading = false;

                    this._errorHandler.showMessage(error);
                }
            );
        }
    }

    capitalizeFirstLetter(text: string) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }


}
