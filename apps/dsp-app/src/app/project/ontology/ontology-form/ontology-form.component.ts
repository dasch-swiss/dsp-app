import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import {
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ApiResponseError,
    CreateOntology,
    KnoraApiConnection,
    OntologyMetadata,
    ReadOntology,
    ReadProject,
    UpdateOntologyMetadata,
} from '@dasch-swiss/dsp-js';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { existingNamesValidator } from '@dsp-app/src/app/main/directive/existing-name/existing-name.directive';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { CustomRegex } from '@dsp-app/src/app/workspace/resource/values/custom-regex';
import { OntologyService } from '../ontology.service';

export interface NewOntology {
    projectIri: string;
    name: string;
    label: string;
}

@Component({
    selector: 'app-ontology-form',
    templateUrl: './ontology-form.component.html',
    styleUrls: ['./ontology-form.component.scss'],
})
export class OntologyFormComponent implements OnInit {
    // project uuid
    @Input() projectUuid: string;

    // ontology iri in case of edit
    @Input() iri: string;

    // existing ontology names; name has to be unique
    @Input() existingOntologyNames: string[] = [];

    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    @Output() updateParent: EventEmitter<string> = new EventEmitter<string>();

    loading: boolean;

    project: ReadProject;

    ontologyForm: UntypedFormGroup;

    ontologyLabel: string;
    ontologyComment: string;

    lastModificationDate: string;

    // ontology name must not contain one of the following words
    forbiddenNames: string[] = [
        'knora',
        'salsah',
        'standoff',
        'ontology',
        'simple',
        'shared',
    ];

    existingNames: [RegExp];

    nameMinLength = 3;
    nameMaxLength = 16;

    formErrors = {
        name: '',
        label: '',
    };

    validationMessages = {
        name: {
            required: 'Name is required.',
            minlength:
                'Name must be at least ' +
                this.nameMinLength +
                ' characters long.',
            maxlength:
                'Name cannot be more than ' +
                this.nameMaxLength +
                ' characters long.',
            pattern:
                "Name shouldn't start with a number or v + number and spaces or special characters (except dash, dot and underscore) are not allowed.",
            existingName: 'This name is not allowed or exists already.',
        },
        label: {
            required: 'Label is required.',
            minlength:
                'Label must be at least ' +
                this.nameMinLength +
                ' characters long.',
        },
    };

    ontologyNameInfo = `
    The unique name
        - must be at least 3 characters long
        - shouldn't begin with a number
        - shouldn't begin with the letter v and a number
        - spaces or special characters (except dash, dot and underscore) are not allowed
        - may not contain these reserved words: knora, ontology, salsah, shared, simple or standoff
        - can't be changed afterwards
    `;

    error = false;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _applicationStateService: ApplicationStateService,
        private _errorHandler: AppErrorHandler,
        private _fb: UntypedFormBuilder,
        private _ontologyService: OntologyService,
        private _route: ActivatedRoute,
        private _router: Router
    ) {}

    ngOnInit() {
        this.loading = true;
        if (!this.projectUuid) {
            // if project shorcode is missing, get it from the url
            this.projectUuid = this._route.parent.snapshot.params.uuid;
        }

        if (!this.existingOntologyNames.length) {
            this._applicationStateService.get('currentProjectOntologies').subscribe(
                (response: ReadOntology[]) => {
                    response.forEach((onto) => {
                        const name = this._ontologyService.getOntologyName(
                            onto.id
                        );
                        this.existingOntologyNames.push(name);
                    });
                },
                () => {} // don't log error to rollbar if 'currentProjectOntologies' does not exist in the application state
            );
        }

        this._applicationStateService.get(this.projectUuid).subscribe(
            (response: ReadProject) => {
                this.project = response;
                this.buildForm();
                this.loading = false;
            }
        );

        if (this.iri) {
            // edit mode: get current ontology
            this._applicationStateService.get('currentOntology').subscribe(
                (response: ReadOntology) => {
                    // add values to the ontology form
                    this.ontologyForm.controls['name'].disable();
                    const name = this._ontologyService.getOntologyName(
                        this.iri
                    );
                    this.ontologyForm.controls['name'].setValue(name);
                    this.ontologyForm.controls['label'].setValue(
                        response.label
                    );
                    this.ontologyForm.controls['label'].setValidators([
                        Validators.required,
                    ]);
                    this.ontologyForm.controls['comment'].setValue(
                        response.comment
                    );
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
            new RegExp('anEmptyRegularExpressionWasntPossible'),
        ];

        // get all project ontologies and read the name
        // name has to be unique; if it already exists
        // show an error message
        for (const name of this.existingOntologyNames) {
            this.existingNames.push(new RegExp('(?:^|W)' + name + '(?:$|W)'));
        }

        for (const name of this.forbiddenNames) {
            this.existingNames.push(new RegExp(name));
        }

        this.ontologyLabel = '';

        this.ontologyForm = this._fb.group({
            name: new UntypedFormControl(
                {
                    value: '',
                    disabled: false,
                },
                [
                    Validators.required,
                    Validators.minLength(this.nameMinLength),
                    Validators.maxLength(this.nameMaxLength),
                    existingNamesValidator(this.existingNames),
                    Validators.pattern(CustomRegex.ID_NAME_REGEX),
                ]
            ),
            label: new UntypedFormControl(
                {
                    value: this.ontologyLabel,
                    disabled: false,
                },
                [Validators.required, Validators.minLength(this.nameMinLength)]
            ),
            comment: new UntypedFormControl({
                value: this.ontologyComment,
                disabled: false,
            }),
        });

        this.ontologyForm.valueChanges.subscribe(() => this.onValueChanged());

        if (!this.iri) {
            this.ontologyForm.get('name').valueChanges.subscribe((val) => {
                this.ontologyForm.controls.label.setValue(
                    this.capitalizeFirstLetter(val)
                );
            });
        }
    }

    onValueChanged() {
        if (!this.ontologyForm) {
            return;
        }

        Object.keys(this.formErrors).map((field) => {
            this.formErrors[field] = '';
            const control = this.ontologyForm.get(field);
            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];
                Object.keys(control.errors).map((key) => {
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

            this._dspApiConnection.v2.onto
                .updateOntology(ontologyData)
                .subscribe(
                    (response: OntologyMetadata) => {
                        this.updateParent.emit(response.id);
                        this.loading = false;
                        this.closeDialog.emit(response.id);
                        // go to the new ontology page
                        // refresh whole page; todo: would be better to use an event emitter
                        window.location.reload();
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
            ontologyData.label =
                this.project.shortname +
                ': ' +
                this.ontologyForm.controls['label'].value;
            ontologyData.name = this.ontologyForm.controls['name'].value;
            ontologyData.comment = this.ontologyForm.controls['comment'].value;
            ontologyData.attachedToProject = this.project.id;

            this._dspApiConnection.v2.onto
                .createOntology(ontologyData)
                .subscribe(
                    (response: OntologyMetadata) => {
                        this.updateParent.emit(response.id);
                        this.loading = false;
                        // go to the new ontology page
                        const name = this._ontologyService.getOntologyName(
                            response.id
                        );
                        this._router.navigate(['ontology', name], {
                            relativeTo: this._route.parent,
                        });
                    },
                    (error: ApiResponseError) => {
                        // in case of an error... e.g. because the ontolog iri is not unique, rebuild the form including the error message
                        this.formErrors['name'] +=
                            this.validationMessages['name']['existingName'] +
                            ' ';
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
