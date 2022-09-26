import { Component, EventEmitter, Inject, Input, OnChanges, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    Constants,
    KnoraApiConnection,
    ReadProject,
    ReadUser,
    StringLiteral,
    UpdateUserRequest,
    User,
    UserResponse,
    UsersResponse
} from '@dasch-swiss/dsp-js';
import { AppGlobal } from 'src/app/app-global';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { existingNamesValidator } from 'src/app/main/directive/existing-name/existing-name.directive';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { NotificationService } from 'src/app/main/services/notification.service';
import { Session, SessionService } from 'src/app/main/services/session.service';
import { CustomRegex } from 'src/app/workspace/resource/values/custom-regex';
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
    @Input() projectCode?: string;
    @Input() name?: string;

    /**
     * send user data to parent component;
     * in case of dialog box?
     */
    @Output() closeDialog: EventEmitter<any> = new EventEmitter<ReadUser>();

    /**
     * status for the progress indicator and error
     */
    loading = false;
    loadingData = true;
    error: boolean;

    /**
     * user data
     */
    user: ReadUser;

    title: string;
    subtitle: string;

    /**
     * define, if the user has system administration permission
     */
    sysAdminPermission = false;

    /**
     * username should be unique
     */
    existingUsernames: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible')
    ];
    usernameMinLength = 4;

    /**
     * email should be unique
     */
    existingEmails: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible')
    ];

    /**
     * form group for the form controller
     */
    userForm: UntypedFormGroup;

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

    // permissions of logged-in user
    session: Session;
    sysAdmin = false;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _formBuilder: UntypedFormBuilder,
        private _notification: NotificationService,
        private _route: ActivatedRoute,
        private _session: SessionService
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
        this.loadingData = true;

        // get information about the logged-in user
        this.session = this._session.getSession();
        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        if (this.username) {
            /**
             * edit mode: get user data from cache
             */

            this.title = this.username;
            this.subtitle = "'appLabels.form.user.title.edit' | translate";

            // set the cache first: user data to edit
            this._cache.get(this.username, this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.username));
            // get user data from cache
            this._cache.get(this.username, this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.username)).subscribe(
                (response: ApiResponseData<UserResponse>) => {
                    this.user = response.body.user;
                    this.loadingData = !this.buildForm(this.user);
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
        } else {
            /**
             * create mode: empty form for new user
             */

            // set the cache first: all users to avoid same email-address / username twice
            this._cache.get('allUsers', this._dspApiConnection.admin.usersEndpoint.getUsers());
            // get existing users to avoid same usernames and email addresses
            this._cache.get('allUsers', this._dspApiConnection.admin.usersEndpoint.getUsers()).subscribe(
                (response: ApiResponseData<UsersResponse>) => {
                    for (const user of response.body.users) {
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
                    // this.projectCode = this._route.snapshot.queryParams['project'];
                    // const name: string = this._route.snapshot.queryParams['value'];
                    const newUser: ReadUser = new ReadUser();

                    if (CustomRegex.EMAIL_REGEX.test(this.name)) {
                        newUser.email = this.name;
                    } else {
                        newUser.username = this.name;
                    }
                    // build the form
                    this.loadingData = !this.buildForm(newUser);
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
    buildForm(user: ReadUser): boolean {
        // get info about system admin permission
        if (user.id && user.permissions.groupsPerProject[Constants.SystemProjectIRI]) {
            // this user is member of the system project. does he has admin rights?
            this.sysAdminPermission = user.permissions.groupsPerProject[Constants.SystemProjectIRI].includes(Constants.SystemAdminGroupIRI);
        }

        // if user is defined, we're in the edit mode
        // otherwise "create new user" mode is active
        const editMode = !!user.id;

        this.userForm = this._formBuilder.group({
            givenName: new UntypedFormControl(
                {
                    value: user.givenName,
                    disabled: false
                },
                [Validators.required]
            ),
            familyName: new UntypedFormControl(
                {
                    value: user.familyName,
                    disabled: false
                },
                [Validators.required]
            ),
            email: new UntypedFormControl(
                {
                    value: user.email,
                    disabled: editMode
                },
                [
                    Validators.required,
                    Validators.pattern(CustomRegex.EMAIL_REGEX),
                    existingNamesValidator(this.existingEmails)
                ]
            ),
            username: new UntypedFormControl(
                {
                    value: user.username,
                    disabled: editMode
                },
                [
                    Validators.required,
                    Validators.minLength(4),
                    Validators.pattern(CustomRegex.USERNAME_REGEX),
                    existingNamesValidator(this.existingUsernames)
                ]
            ),
            password: new UntypedFormControl(
                {
                    value: '',
                    disabled: editMode
                }
            ),
            lang: new UntypedFormControl({
                value: user.lang ? user.lang : 'en',
                disabled: false
            }),
            status: new UntypedFormControl({
                value: user.status ? user.status : true,
                disabled: editMode
            }),
            systemAdmin: new UntypedFormControl({
                value: this.sysAdminPermission,
                disabled: editMode
            })
            // 'systemAdmin': this.sysAdminPermission,
            // 'group': null
        });

        this.userForm.valueChanges.subscribe(data => this.onValueChanged());
        return true;
    }

    onValueChanged() {
        if (!this.userForm) {
            return;
        }

        const form = this.userForm;

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

    // get password from password form and send it to user form
    getPassword(pw: string) {
        this.userForm.controls.password.setValue(pw);
    }

    submitData(): void {
        this.loading = true;

        const returnUrl: string =
            this._route.snapshot.queryParams['returnUrl'] ||
            '/user/' + this.userForm.controls['username'].value;

        if (this.username) {
            // edit mode: update user data
            // username doesn't seem to be optional in @dasch-swiss/dsp-js usersEndpoint type UpdateUserRequest.
            // but a user can't change the username, the field is disabled, so it's not a value in this form.
            // we have to make a small hack here.
            const userData: UpdateUserRequest = new UpdateUserRequest();
            // userData.username = this.userForm.value.username;
            userData.familyName = this.userForm.value.familyName;
            userData.givenName = this.userForm.value.givenName;
            // userData.email = this.userForm.value.email;
            userData.lang = this.userForm.value.lang;

            this._dspApiConnection.admin.usersEndpoint.updateUserBasicInformation(this.user.id, userData).subscribe(
                (response: ApiResponseData<UserResponse>) => {
                    this.user = response.body.user;
                    this.buildForm(this.user);
                    // update cache
                    const session: Session = this._session.getSession();
                    if (session.user.name === this.username) {
                        // update logged in user session
                        session.user.lang = this.userForm.controls['lang'].value;
                        localStorage.setItem('session', JSON.stringify(session));
                    }

                    this._cache.set(this.username, response);

                    this._notification.openSnackBar('You have successfully updated the user\'s profile data.');
                    this.closeDialog.emit();
                    this.loading = false;

                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                    this.loading = false;
                    this.error = true;
                }
            );
        } else {
            // new: create user
            const userData: User = new User();
            userData.username = this.userForm.value.username;
            userData.familyName = this.userForm.value.familyName;
            userData.givenName = this.userForm.value.givenName;
            userData.email = this.userForm.value.email;
            userData.password = this.userForm.value.password;
            userData.systemAdmin = this.userForm.value.systemAdmin;
            userData.status = this.userForm.value.status;
            userData.lang = this.userForm.value.lang;

            this._dspApiConnection.admin.usersEndpoint.createUser(userData).subscribe(
                (response: ApiResponseData<UserResponse>) => {

                    this.user = response.body.user;
                    this.buildForm(this.user);

                    // update cache: users list
                    this._cache.del('allUsers');
                    this._cache.get('allUsers', this._dspApiConnection.admin.usersEndpoint.getUsers());

                    if (this.projectCode) {
                        // if a projectCode exists, add the user to the project
                        // get project iri by projectCode
                        this._cache.get(this.projectCode).subscribe(
                            (res: ReadProject) => {
                                // add user to project
                                this._dspApiConnection.admin.usersEndpoint.addUserToProjectMembership(this.user.id, res.id).subscribe(
                                    () => {
                                        // update project cache and member of project cache
                                        this._cache.get('members_of_' + this.projectCode, this._dspApiConnection.admin.projectsEndpoint.getProjectMembersByShortcode(this.projectCode));
                                        this.closeDialog.emit(this.user);
                                        this.loading = false;
                                    },
                                    (error: ApiResponseError) => {
                                        this._errorHandler.showMessage(error);
                                    }
                                );
                            },
                            (error: ApiResponseError) => {
                                this._errorHandler.showMessage(error);
                            }
                        );
                    } else {
                        this.closeDialog.emit(this.user);
                        this.loading = false;
                    }
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                    this.loading = false;
                    this.error = true;
                }
            );
        }
    }

}
