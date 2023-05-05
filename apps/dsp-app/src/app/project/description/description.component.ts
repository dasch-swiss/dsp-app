import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    KnoraApiConnection,
    ProjectResponse,
    ReadProject,
    StringLiteral,
    UpdateProjectRequest
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dsp-app/src/app/main/declarations/dsp-api-tokens';
import { ErrorHandlerService } from '@dsp-app/src/app/main/services/error-handler.service';
import { NotificationService } from '@dsp-app/src/app/main/services/notification.service';
import { Session, SessionService } from '@dsp-app/src/app/main/services/session.service';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';
import { CacheService } from '../../main/cache/cache.service';

@Component({
    selector: 'app-description',
    templateUrl: './description.component.html',
    styleUrls: ['./description.component.scss']
})

export class DescriptionComponent implements OnInit {

    // loading for progress indicator
    loading: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin = false;
    projectAdmin = false;

    // project uuid; as identifier in project cache service
    projectUuid: string;

    // project data
    project: ReadProject;

    description: StringLiteral[];
    descriptionMaxLength = 2000;

    // keywords is an array of objects of {name: 'string'}
    keywords: string[] = [];
    // separator: Enter, comma
    separatorKeyCodes = [ENTER, COMMA];

    form: FormGroup;

    formOpen = false;

    formErrors = {
        'longname': '',
        'description': '',
        'keywords': ''
    };

    validationMessages = {
        'longname': {
            'required': 'Project (long) name is required.'
        },
        'description': {
            'required': 'A description is required.',
            'maxlength': 'Description cannot be more than ' + this.descriptionMaxLength + ' characters long.'
        },
        'keywords': {
            'required': 'At least one keyword is required.'
        }
    };

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _session: SessionService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _fb: FormBuilder,
        private _projectService: ProjectService,
        private _notification: NotificationService,
    ) {
        // get the uuid of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectUuid = params.get('uuid');
        });

    }

    ngOnInit() {
        this.loading = true;

        // get information about the logged-in user, if one is logged-in
        if (this._session.getSession()) {
            this.session = this._session.getSession();
            // is the logged-in user system admin?
            this.sysAdmin = this.session.user.sysAdmin;
        }

        // get project info from backend
        this.getProject();

    }

    /**
     * this method is for the form error handling
     *
     * @param data Data which changed.
     */
    onValueChanged() {

        if (!this.form) {
            return;
        }

        const form = this.form;

        Object.keys(this.formErrors).map(field => {
            this.formErrors[field] = '';
            const control = form.get(field);
            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];
                Object.keys(control.errors).map(key => {
                    this.formErrors[field] += messages[key] + ' ';
                });

            }
        });
    }

    getProject() {
        // get the project data from cache
        this._cache.get(this.projectUuid).subscribe(
            (response: ReadProject) => {
                this.project = response;

                // is logged-in user projectAdmin?
                if (this._session.getSession()) {
                    this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);
                }

                this.buildForm();
                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );

        this.loading = false;
    }

    buildForm(): void {
        // create deep copy of description array because it contains objects
        this.description = JSON.parse(JSON.stringify(this.project.description));

        // create shallow copy of keywords array
        this.keywords = this.project.keywords.slice();

        this.form = this._fb.group({
            'longname': new FormControl({
                value: this.project.longname, disabled: false
            }, [ Validators.required ]),
            'keywords': new FormControl({
                // must be empty (even in edit mode), because of the mat-chip-list
                value: [], disabled: false
            })
        });

        this.form.valueChanges
            .subscribe(() => this.onValueChanged());
    }

    /**
     * gets string literal
     * @param data
     */
    getStringLiteral(data: StringLiteral[]) {
        this.description = data;
        if (!this.description.length) {
            this.formErrors['description'] = this.validationMessages['description'].required;
        } else {
            this.formErrors['description'] = '';
        }
    }

    addKeyword(event: MatChipInputEvent): void {
        const input = event.chipInput.inputElement;
        const value = event.value;

        if (!this.keywords) {
            this.keywords = [];
        }

        // add keyword
        if ((value || '').trim()) {
            this.keywords.push(value.trim());
        }

        // reset the input value
        if (input) {
            input.value = '';
        }
    }

    removeKeyword(keyword: string): void {
        const index = this.keywords.indexOf(keyword);

        if (index >= 0) {
            this.keywords.splice(index, 1);
        }
    }

    toggleForm() {
        this.formOpen = !this.formOpen;

        if(this.formOpen) {
            this.buildForm();
        }
    }

    submitData() {
        this.loading = true;

        this.form.controls['keywords'].setValue(this.keywords);

        const projectData: UpdateProjectRequest = new UpdateProjectRequest();
        projectData.description = [new StringLiteral()];
        projectData.keywords = this.form.value.keywords;
        projectData.longname = this.form.value.longname;
        projectData.status = true;

        let i = 0;
        for (const d of this.description) {
            projectData.description[i] = new StringLiteral();
            projectData.description[i].language = d.language;
            projectData.description[i].value = d.value;
            i++;
        }

        // edit / update project data
        this._dspApiConnection.admin.projectsEndpoint.updateProject(this.project.id, projectData).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {

                this.project = response.body.project;

                // update cache
                this._cache.set(this._projectService.iriToUuid(this.project.id), this.project);

                this._notification.openSnackBar('You have successfully updated the project information.');

                this.loading = false;
                this.formOpen = false;

            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
                this.loading = false;
            }
        );
    }
}
