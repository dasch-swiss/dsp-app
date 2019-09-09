import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { existingNamesValidator } from '@knora/action';
import { ApiServiceError, Project, ProjectsService, User, UsersService } from '@knora/core';
import { CacheService } from '../../main/cache/cache.service';

@Component({
    selector: 'app-project-form',
    templateUrl: './project-form.component.html',
    styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit {

    loading: boolean = true;

    errorMessage: any;

    @Input() projectcode: string;

    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    project: Project;

    // is the logged-in user system admin?
    sysAdmin: boolean = false;

    /**
     * shortcode and shortname must be unique
     */
    existingShortNames: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible')
    ];
    shortnameRegex = /^[a-zA-Z]+\S*$/;

    existingShortcodes: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible')
    ];
    shortcodeRegex = /^[0-9A-Fa-f]+$/;

    /**
     * some restrictions and rules for
     * description, shortcode, shortname and keywords
     */
    descriptionMaxLength = 2000;
    shortcodeMinLength = 4;
    shortcodeMaxLength: number = this.shortcodeMinLength;

    shortnameMinLength = 3;
    shortnameMaxLength = 16;

    // keywords is an array of objects of {name: 'string'}
    keywords: string[] = [];
    // separator: Enter, comma
    separatorKeyCodes = [ENTER, COMMA];
    visible = true;
    selectable = true;
    removable = true;
    addOnBlur = true;

    /**
     * success of sending data
     */
    success = false;

    /**
     * message after successful post
     */
    successMessage: any = {
        status: 200,
        statusText: 'You have successfully updated the project data.'
    };

    /**
     * form group, errors and validation messages
     */
    form: FormGroup;

    formErrors = {
        'shortname': '',
        'longname': '',
        'shortcode': '',
        'description': ''
        //        'institution': '',
        //        'keywords': '',
    };

    validationMessages = {
        'shortname': {
            'required': 'Short name is required.',
            'minlength': 'Short name must be at least ' + this.shortnameMinLength + ' characters long.',
            'maxlength': 'Short name cannot be more than ' + this.shortnameMaxLength + ' characters long.',
            'pattern': 'Short name shouldn\'t start with a number; Spaces are not allowed.',
            'existingName': 'This short name is already taken.'
        },
        'longname': {
            'required': 'Project (long) name is required.'
        },
        'shortcode': {
            'required': 'Shortcode is required',
            'maxlength': 'Shortcode cannot be more than ' + this.shortcodeMaxLength + ' characters long.',
            'minlength': 'Shortcode cannot be less than ' + this.shortcodeMinLength + ' characters long.',
            'pattern': 'This is not a hexadecimal value!',
            'existingName': 'This shortcode is already taken.'
        },
        'description': {
            'required': 'A description is required.',
            'maxlength': 'Description cannot be more than ' + this.descriptionMaxLength + ' characters long.'
        }
        //        'institution': {},
        //        'keywords': {
        //            'required': 'At least one keyword is required.'
        //        }
    };

    constructor (private _cache: CacheService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _projects: ProjectsService,
        private _users: UsersService,
        private _fb: FormBuilder,
        private _titleService: Title) {

        // set the page title
        // this._titleService.setTitle('New project');

        // this.projectcode = this._route.parent.snapshot.params.shortcode;

        /* if (this.projectcode) {
            // set the page title
            this._titleService.setTitle('Edit project ' + this.projectcode);
        } */
    }

    ngOnInit() {

        // get a list of all projects and create an array of the short names, but only in "create new" mode
        // the short name should be unique and with the array list, we can prevent
        // to have the same short name; proof it with the ForbiddenName directive
        if (!this.projectcode) {
            // create new project
            this._projects.getAllProjects()
                .subscribe(
                    (result: Project[]) => {
                        for (const project of result) {
                            this.existingShortNames.push(new RegExp('(?:^|\W)' + project.shortname.toLowerCase() + '(?:$|\W)'));
                            if (project.shortcode !== null) {
                                this.existingShortcodes.push(new RegExp('(?:^|\W)' + project.shortcode.toLowerCase() + '(?:$|\W)'));
                            }
                        }
                    },
                    (error: ApiServiceError) => {
                        console.error(error);
                        this.errorMessage = error;
                    }
                );

            if (this.project === undefined) {
                this.project = new Project();
                this.project.status = true;
            }
            this.buildForm(this.project);

            this.loading = false;

        } else {
            // edit mode
            this.sysAdmin = JSON.parse(localStorage.getItem('session')).user.sysAdmin;
            this._projects.getProjectByShortcode(this.projectcode)
                .subscribe(
                    (result: Project) => {
                        this.project = result;

                        this.buildForm(this.project);

                        this.loading = false;
                    },
                    (error: ApiServiceError) => {
                        this.errorMessage = error;
                    }
                );
        }
    }

    /**
     *
     * @param project Project data: "empty" means "create new project",
     * but if there are project data, it means edit mode
     */
    buildForm(project: Project): void {
        // if project is defined, we're in the edit mode
        // otherwise "create new project" mode is active
        // edit mode is true, when a project id (iri) exists
        const editMode: boolean = (!!project.id);

        // disabled is true, if project status is false (= archived);
        const disabled: boolean = (project.id !== undefined && !project.status);

        // separate list of keywords
        this.keywords = project.keywords;

        this.form = this._fb.group({
            'shortname': new FormControl({
                value: project.shortname, disabled: editMode
            }, [
                    Validators.required,
                    Validators.minLength(this.shortnameMinLength),
                    Validators.maxLength(this.shortnameMaxLength),
                    existingNamesValidator(this.existingShortNames),
                    Validators.pattern(this.shortnameRegex)
                ]),
            'longname': new FormControl({
                value: project.longname, disabled: disabled
            }, [
                    Validators.required
                ]),
            'shortcode': new FormControl({
                value: project.shortcode, disabled: (editMode && project.shortcode !== null)
            }, [
                    Validators.required,
                    Validators.minLength(this.shortcodeMinLength),
                    Validators.maxLength(this.shortcodeMaxLength),
                    existingNamesValidator(this.existingShortcodes),
                    Validators.pattern(this.shortcodeRegex)
                ]),
            'description': new FormControl({
                value: project.description[0].value, disabled: disabled
            }, [
                    Validators.maxLength(this.descriptionMaxLength)
                ]),
            //            'institution': new FormControl({
            //                value: project.institution, disabled: disabled
            //            }),
            'logo': new FormControl({
                value: project.logo, disabled: disabled
            }),
            'id': [project.id],
            'status': [true],
            'selfjoin': [false],
            'keywords': new FormControl({
                value: [], disabled: disabled
            })          // must be empty (even in edit mode), because of the mat-chip-list
        });

        this.form.valueChanges
            .subscribe(data => this.onValueChanged(data));
    }

    /**
     *
     * @param data Data which changed.
     * This method is for the form error handling
     */
    onValueChanged(data?: any) {

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

    addKeyword(event: MatChipInputEvent): void {
        const input = event.input;
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

    removeKeyword(keyword: any): void {

        const index = this.keywords.indexOf(keyword);

        if (index >= 0) {
            this.keywords.splice(index, 1);
        }
    }

    submitData() {
        this.loading = true;

        // a) update keywords from mat-chip-list
        if (!this.keywords) {
            this.keywords = [];
        }
        this.form.controls['keywords'].setValue(this.keywords);
        // this.form.controls['keywords'].disabled = !this.project.status;

        // b) update description field / multi language preparation
        // FIXME: this is a quick (hardcoded) hack:
        // TODO: create multi language input fields
        this.form.controls['description'].setValue([{
            'language': 'en',
            'value': this.form.controls['description'].value
        }]);


        if (this.projectcode) {
            // edit / update project data
            this._projects.updateProject(this.project.id, this.form.value).subscribe(
                (result: Project) => {

                    //                    console.log(result);
                    this.project = result;
                    this.buildForm(this.project);

                    // update cache
                    this._cache.set(this.form.controls['shortcode'].value, result);

                    this.success = true;

                    this.loading = false;

                    // redirect to project page
                    /*
                    this._router.navigateByUrl('/project', {skipLocationChange: true}).then(() =>
                        this._router.navigate(['/project/' + this.form.controls['shortcode'].value])
                    );
                    */

                },
                (error: ApiServiceError) => {
                    this.errorMessage = error;
                    this.loading = false;
                }
            );
        } else {
            // create new project
            this._projects.createProject(this.form.value).subscribe(
                (project: Project) => {
                    this.project = project;
                    this.buildForm(this.project);

                    // add logged-in user to the project
                    // who am I?
                    this._users.getUserByUsername(JSON.parse(localStorage.getItem('session')).user.name).subscribe(
                        (user: User) => {
                            this._users.addUserToProject(user.id, project.id).subscribe(
                                (add: User) => {

                                    this.loading = false;
                                    this.closeMessage();
                                    // redirect to (new) project page
                                    this._router.navigateByUrl('/project', { skipLocationChange: true }).then(() =>
                                        this._router.navigate(['/project/' + this.form.controls['shortcode'].value])
                                    );
                                },
                                (error: any) => {
                                    console.error(error);
                                }
                            );
                        },
                        (error: any) => {
                            console.error(error);
                        }
                    );

                },
                (error: ApiServiceError) => {
                    this.errorMessage = error;
                    this.loading = false;
                }
            );
        }
    }

    /**
     * Delete / archive project
     * @param id Project Iri
     */
    delete(id: string) {
        // ev.preventDefault();
        // TODO: "are you sure?"-dialog

        // if true
        this._projects.deleteProject(id).subscribe(
            (res: Project) => {
                // reload page
                this.loading = true;
                this.refresh();
            },
            (error: ApiServiceError) => {
                // const message: MessageData = error;
                console.error(error);
                /*
                const errorRef = this._dialog.open(MessageDialogComponent, <MatDialogConfig>{
                    data: {
                        message: message
                    }
                });
                */
            }
        );

        // close dialog box

        // else: cancel action
    }

    /**
     * Activate already deleted project
     *
     * @param id Project Iri
     */
    activate(id: string) {

        this._projects.activateProject(id).subscribe(
            (res: Project) => {
                // reload page
                this.loading = true;
                this.refresh();
            },
            (error: ApiServiceError) => {
                // const message: MessageData = error;
                console.error(error);
                /*
                const errorRef = this._dialog.open(MessageDialogComponent, <MatDialogConfig>{
                    data: {
                        message: message
                    }
                });
                */
            }
        );
    }

    /**
     * refresh the page after significant change (e.g. delete project)
     */
    refresh(): void {
        // refresh the component
        this.loading = true;
        // update the cache
        this._cache.del(this.projectcode);
        this._cache.get(this.projectcode, this._projects.getProjectByShortcode(this.projectcode));
        this.buildForm(this.project);
        window.location.reload();
        this.loading = false;
    }

    /**
     * Reset the form
     */
    resetForm(ev: Event, project?: Project) {
        ev.preventDefault();

        project = (project ? project : new Project());

        this.buildForm(project);

        // TODO: fix "set value" for keywords field
        //        this.form.controls['keywords'].setValue(this.keywords);
    }

    closeMessage() {
        this.closeDialog.emit();
    }
}
