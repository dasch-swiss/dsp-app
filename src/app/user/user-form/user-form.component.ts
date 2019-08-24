import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { existingNamesValidator } from '@knora/action';
import { Session } from '@knora/authentication';
import { ApiServiceError, KnoraConstants, Project, ProjectsService, StringLiteral, User, UsersService, Utils } from '@knora/core';
import { AppGlobal } from 'src/app/app-global';
import { CacheService } from '../../main/cache/cache.service';

@Component({
    selector: 'app-user-form',
    templateUrl: './user-form.component.html',
    styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit, OnChanges {
    // the user form can be used in several cases:
    // a) guest --> register: create new user
    // b) system admin or project admin --> add: create new user
    // c) system admin or project admin --> edit: edit (not own) user
    // d) logged-in user --> edit: edit own user data
    // => so, this component has to know who is who and who is doing what;
    // the form needs then some permission checks

    public readonly RegexUsername = /^[a-zA-Z0-9]+$/;

    /**
     * status for the progress indicator
     */
    loading: boolean = true;

    /**
     * user iri, email or username: in case of edit
     *
     */
    @Input() username?: string;

    /**
     * if the form was built to add new user to project,
     * we get a project shortcode and a name (e-mail or username)
     * from the "add-user-autocomplete" input
     */
    @Input() projectcode?: string;
    @Input() name?: string;

    /**
     * user data
     */
    user: User;

    title: string;
    subtitle: string;

    /**
     * send user data to parent component;
     * in case of dialog box?
     */
    @Output() closeDialog: EventEmitter<any> = new EventEmitter<User>();

    /**
     * define, if the user has system administration permission
     */
    sysAdminPermission: boolean = false;

    /**
     * username should be unique
     */
    existingUsernames: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible')
    ];
    usernameMinLength: number = 4;

    /**
     * email should be unique
     */
    existingEmails: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible')
    ];

    /**
     * password will be defined in password-form
     */
    password: string = '';

    /**
     * form group for the form controller
     */
    form: FormGroup;

    /**
     * error checking on the following fields
     */
    formErrors = {
        givenName: '',
        familyName: '',
        email: '',
        username: ''
    };

    /**
     * error hints
     */
    validationMessages = {
        givenName: {
            required: 'First name is required.'
        },
        familyName: {
            required: 'Last name is required.'
        },
        email: {
            required: 'Email address is required.',
            pattern: 'This doesn\'t appear to be a valid email address.',
            existingName:
                'This user exists already. If you want to edit it, ask a system administrator.',
            member: 'This user is already a member of the project.'
        },
        username: {
            required: 'Username is required.',
            pattern:
                'Spaces and special characters are not allowed in username',
            minlength:
                'Username must be at least ' +
                this.usernameMinLength +
                ' characters long.',
            existingName:
                'This user exists already. If you want to edit it, ask a system administrator.',
            member: 'This user is already a member of the project.'
        }
    };

    /**
     * in case of an API error
     */
    errorMessage: any;

    /**
     * success of sending data
     */
    success = false;
    /**
     * message after successful post
     */
    successMessage: any = {
        status: 200,
        statusText: "You have successfully updated user's profile data."
    };

    /**
     * selector to set default language
     */
    languagesList: StringLiteral[] = AppGlobal.languagesList;

    constructor (
        private _route: ActivatedRoute,
        private _router: Router,
        private _cache: CacheService,
        private _users: UsersService,
        private _projectsService: ProjectsService,
        private _formBuilder: FormBuilder
    ) {
        // get username from url
        if (
            this._route.snapshot.params.name &&
            this._route.snapshot.params.name.length > 3
        ) {
            this.username = this._route.snapshot.params.name;
        }
    }

    ngOnInit() {
        this.loading = true;

        if (this.username) {
            /**
             * edit mode: get user data from cache
             */

            this.title = this.username;
            this.subtitle = "'appLabels.form.user.title.edit' | translate";

            // set the cache first: user data to edit
            this._cache.get(this.username, this._users.getUserByUsername(this.username));
            // get user data from cache
            this._cache.get(this.username, this._users.getUserByUsername(this.username)).subscribe(
                (response: User) => {
                    this.user = response;
                    this.loading = !this.buildForm(this.user);
                },
                (error: any) => {
                    console.error(error);
                }
            );
        } else {
            /**
             * create mode: empty form for new user
             */

            // set the cache first: all users to avoid same email-address / username twice
            this._cache.get('allUsers', this._users.getAllUsers());
            // get existing users to avoid same usernames and email addresses
            this._cache.get('allUsers', this._users.getAllUsers()).subscribe((result: User[]) => {
                for (const user of result) {
                    // email address of the user should be unique.
                    // therefore we create a list of existing email addresses to avoid multiple use of user names
                    this.existingEmails.push(
                        new RegExp('(?:^|W)' + user.email.toLowerCase() + '(?:$|W)')
                    );
                    // username should also be unique.
                    // therefore we create a list of existingUsernames to avoid multiple use of user names
                    this.existingUsernames.push(
                        new RegExp('(?:^|W)' + user.username.toLowerCase() + '(?:$|W)')
                    );
                }

                // get parameters from url, if they exist
                // this.projectcode = this._route.snapshot.queryParams['project'];
                // const name: string = this._route.snapshot.queryParams['value'];
                const newUser: User = new User();

                if (Utils.RegexEmail.test(this.name)) {
                    newUser.email = this.name;
                } else {
                    newUser.username = this.name;
                }
                // build the form
                this.loading = !this.buildForm(newUser);
            });
        }
    }

    ngOnChanges() {
        if (this.user) {
            this.buildForm(this.user);
        }
    }

    /**
     * build the whole form
     *
     */
    buildForm(user: User): boolean {
        // get info about system admin permission
        if (user.id && user.permissions.groupsPerProject[KnoraConstants.SystemProjectIRI]) {
            // this user is member of the system project. does he has admin rights?
            this.sysAdminPermission = user.permissions.groupsPerProject[KnoraConstants.SystemProjectIRI].includes(KnoraConstants.SystemAdminGroupIRI);
        }

        // if user is defined, we're in the edit mode
        // otherwise "create new user" mode is active
        const editMode: boolean = !!user.id;

        this.form = this._formBuilder.group({
            givenName: new FormControl(
                {
                    value: user.givenName,
                    disabled: false
                },
                [Validators.required]
            ),
            familyName: new FormControl(
                {
                    value: user.familyName,
                    disabled: false
                },
                [Validators.required]
            ),
            email: new FormControl(
                {
                    value: user.email,
                    disabled: editMode
                },
                [
                    Validators.required,
                    Validators.pattern(Utils.RegexEmail),
                    existingNamesValidator(this.existingEmails)
                ]
            ),
            username: new FormControl(
                {
                    value: user.username,
                    disabled: editMode
                },
                [
                    Validators.required,
                    Validators.minLength(4),
                    Validators.pattern(this.RegexUsername),
                    existingNamesValidator(this.existingUsernames)
                ]
            ),
            lang: new FormControl({
                value: user.lang ? user.lang : 'en',
                disabled: false
            }),
            status: new FormControl({
                value: user.status ? user.status : true,
                disabled: editMode
            }),
            systemAdmin: new FormControl({
                value: this.sysAdminPermission,
                disabled: editMode
            })
            // 'systemAdmin': this.sysAdminPermission,
            // 'group': null
        });

        // this.loading = false;

        this.form.valueChanges.subscribe(data => this.onValueChanged());
        return true;
    }

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

    // get password from password form
    getPassword(pw: string) {
        // this.form.controls.password.setValue(pw);
        this.password = pw;
    }

    submitData(): void {
        this.loading = true;

        const returnUrl: string =
            this._route.snapshot.queryParams['returnUrl'] ||
            '/user/' + this.form.controls['username'].value;

        if (this.username) {
            // edit mode: update user data
            this._users
                .updateBasicUserInformation(this.user.id, this.form.value)
                .subscribe(
                    (result: User) => {
                        this.user = result;
                        this.buildForm(this.user);
                        // update cache
                        const session: Session = JSON.parse(
                            localStorage.getItem('session')
                        );
                        if (session.user.name === this.username) {
                            // update logged in user session
                            session.user.lang = this.form.controls[
                                'lang'
                            ].value;
                            localStorage.setItem(
                                'session',
                                JSON.stringify(session)
                            );
                        }

                        this._cache.set(this.username, result);

                        this.success = true;

                        this.loading = false;
                    },
                    (error: ApiServiceError) => {
                        this.errorMessage = error;
                        this.loading = false;
                        this.success = false;
                    }
                );
        } else {
            // new: create user
            this._users.createUser(this.form.value).subscribe(
                (user: User) => {
                    this.user = user;
                    this.buildForm(this.user);

                    // update cache: users list
                    this._cache.del('allUsers');
                    this._cache.get('allUsers', this._users.getAllUsers());

                    if (this.projectcode) {
                        // if a projectcode exists, add the user to the project
                        // get project iri by projectcode
                        this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode));
                        this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode)).subscribe(
                            (p: Project) => {
                                // add user to project
                                this._users.addUserToProject(this.user.id, p.id).subscribe(
                                    () => {
                                        // update project cache and member of project cache
                                        this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode));
                                        this._cache.get('members_of_' + this.projectcode, this._projectsService.getProjectMembersByShortcode(this.projectcode));
                                        this.closeMessage();
                                        this.loading = false;
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
                    } else {
                        this.closeMessage();
                        this.loading = false;
                    }
                },
                (error: ApiServiceError) => {
                    this.errorMessage = error;
                    this.loading = false;
                }
            );
        }
    }

    /**
     * Reset the form
     */
    resetForm(ev: Event, user?: User) {
        ev.preventDefault();

        user = user ? user : new User();

        this.buildForm(user);
    }

    closeMessage() {
        this.closeDialog.emit(this.user);
    }
}
