import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Inject,
    Input,
    OnChanges,
    OnInit,
    Output,
} from '@angular/core';
import {
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import {
    ApiResponseData,
    ApiResponseError,
    Constants,
    KnoraApiConnection,
    ReadUser,
    StringLiteral,
    UpdateUserRequest,
    User,
    UserResponse,
} from '@dasch-swiss/dsp-js';
import { AppGlobal } from '@dsp-app/src/app/app-global';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { existingNamesValidator } from '@dsp-app/src/app/main/directive/existing-name/existing-name.directive';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { CustomRegex } from '@dsp-app/src/app/workspace/resource/values/custom-regex';
import { Observable, combineLatest } from 'rxjs';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { AddUserToProjectMembershipAction, CreateUserAction, LoadProjectMembersAction, ProjectsSelectors, SetUserAction, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { take } from 'rxjs/operators';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-user-form',
    templateUrl: './user-form.component.html',
    styleUrls: ['./user-form.component.scss'],
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
     * if the form was built to add new user to project,
     * we get a project uuid and a name (e-mail or username)
     * from the "add-user-autocomplete" input
     */
    @Input() projectUuid?: string;
    @Input() user?: ReadUser;
    @Input() name?: string;

    /**
     * send user data to parent component;
     * in case of dialog box?
     */
    @Output() closeDialog: EventEmitter<any> = new EventEmitter<ReadUser>();

    /**
     * status for the progress indicator 
     */
    loading = false;
    loadingData = true;
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
        new RegExp('anEmptyRegularExpressionWasntPossible'),
    ];
    usernameMinLength = 4;

    /**
     * email should be unique
     */
    existingEmails: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible'),
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
        username: '',
    };

    /**
     * error hints
     */
    validationMessages = {
        givenName: {
            required: 'First name is required.',
        },
        familyName: {
            required: 'Last name is required.',
        },
        email: {
            required: 'Email address is required.',
            pattern: "This doesn't appear to be a valid email address.",
            existingName:
                'This user exists already. If you want to edit it, ask a system administrator.',
            member: 'This user is already a member of the project.',
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
            member: 'This user is already a member of the project.',
        },
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
        statusText: "You have successfully updated user's profile data.",
    };

    /**
     * selector to set default language
     */
    languagesList: StringLiteral[] = AppGlobal.languagesList;

    @Select(UserSelectors.allUsers) allUsers$: Observable<ReadUser[]>;
    @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;
    @Select(ProjectsSelectors.hasLoadingErrors) hasLoadingErrors$: Observable<boolean>;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: AppErrorHandler,
        private _formBuilder: UntypedFormBuilder,
        private _notification: NotificationService,
        private _projectService: ProjectService,
        private _store: Store,
        private _actions$: Actions,
        private _cd: ChangeDetectorRef,
    ) {
    }

    ngOnInit() {
        this.loadingData = true;

        if (this.user) {
            this.title = this.user.username;
            this.subtitle = "'appLabels.form.user.title.edit' | translate";
            this.loadingData = !this.buildForm(this.user);
        } else {
            /**
             * create mode: empty form for new user
             */

            // get existing users to avoid same usernames and email addresses
            this.allUsers$
                .pipe(take(1))
                .subscribe((allUsers) => {
                    for (const user of allUsers) {
                        // email address of the user should be unique.
                        // therefore we create a list of existing email addresses to avoid multiple use of user names
                        this.existingEmails.push(
                            new RegExp('(?:^|W)' + user.email.toLowerCase() + '(?:$|W)'));
                        // username should also be unique.
                        // therefore we create a list of existingUsernames to avoid multiple use of user names
                        this.existingUsernames.push(
                            new RegExp('(?:^|W)' + user.username.toLowerCase() + '(?:$|W)')
                        );
                    }

                    const newUser: ReadUser = new ReadUser();

                    if (CustomRegex.EMAIL_REGEX.test(this.name)) {
                        newUser.email = this.name;
                    } else {
                        newUser.username = this.name;
                    }
                    // build the form
                    this.loadingData = !this.buildForm(newUser);
                    this._cd.markForCheck();
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
        if (
            user.id &&
            user.permissions.groupsPerProject[Constants.SystemProjectIRI]
        ) {
            // this user is member of the system project. does he has admin rights?
            this.sysAdminPermission = user.permissions.groupsPerProject[
                Constants.SystemProjectIRI
            ].includes(Constants.SystemAdminGroupIRI);
        }

        // if user is defined, we're in the edit mode
        // otherwise "create new user" mode is active
        const editMode = !!user.id;

        this.userForm = this._formBuilder.group({
            givenName: new UntypedFormControl(
                {
                    value: user.givenName,
                    disabled: false,
                },
                [Validators.required]
            ),
            familyName: new UntypedFormControl(
                {
                    value: user.familyName,
                    disabled: false,
                },
                [Validators.required]
            ),
            email: new UntypedFormControl(
                {
                    value: user.email,
                    disabled: editMode,
                },
                [
                    Validators.required,
                    Validators.pattern(CustomRegex.EMAIL_REGEX),
                    existingNamesValidator(this.existingEmails),
                ]
            ),
            username: new UntypedFormControl(
                {
                    value: user.username,
                    disabled: editMode,
                },
                [
                    Validators.required,
                    Validators.minLength(4),
                    Validators.pattern(CustomRegex.USERNAME_REGEX),
                    existingNamesValidator(this.existingUsernames),
                ]
            ),
            password: new UntypedFormControl({
                value: '',
                disabled: editMode,
            }),
            lang: new UntypedFormControl({
                value: user.lang ? user.lang : 'en',
                disabled: false,
            }),
            status: new UntypedFormControl({
                value: user.status ? user.status : true,
                disabled: editMode,
            }),
            systemAdmin: new UntypedFormControl({
                value: this.sysAdminPermission,
                disabled: editMode,
            }),
            // 'systemAdmin': this.sysAdminPermission,
            // 'group': null
        });

        this.userForm.valueChanges.subscribe(() => this.onValueChanged());
        return true;
    }

    onValueChanged() {
        if (!this.userForm) {
            return;
        }

        const form = this.userForm;

        Object.keys(this.formErrors).map((field) => {
            this.formErrors[field] = '';
            const control = form.get(field);
            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];
                Object.keys(control.errors).map((key) => {
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

        if (this.user) {
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

            this._dspApiConnection.admin.usersEndpoint
                .updateUserBasicInformation(this.user.id, userData)
                .subscribe(
                    (response: ApiResponseData<UserResponse>) => {
                        this.user = response.body.user;
                        this.buildForm(this.user);
                        const user = this._store.selectSnapshot(UserSelectors.user) as ReadUser;
                        // update application state
                        if (user.username === this.user.username) {
                            // update logged in user session
                            this.user.lang = this.userForm.controls['lang'].value;
                        }

                        this._store.dispatch(new SetUserAction(this.user));
                        this._notification.openSnackBar(
                            "You have successfully updated the user's profile data."
                        );
                        this.closeDialog.emit();
                        this.loading = false;
                    },
                    (error: ApiResponseError) => {
                        this._errorHandler.showMessage(error);
                        this.loading = false;
                    }
                );
        } else {
            this.createNewUser(this.userForm.value);
        }
    }

    private createNewUser(userForm: any): void {
        const userData: User = new User();
        userData.username = userForm.username;
        userData.familyName = userForm.familyName;
        userData.givenName = userForm.givenName;
        userData.email = userForm.email;
        userData.password = userForm.password;
        userData.systemAdmin = userForm.systemAdmin;
        userData.status = userForm.status;
        userData.lang = userForm.lang;

        this._store.dispatch(new CreateUserAction(userData));
        combineLatest([this._actions$.pipe(ofActionSuccessful(CreateUserAction)), this.allUsers$])
                .pipe(take(1))
                .subscribe(([loadUsersAction, allUsers]) => {
                this.user = allUsers.find(user => user.username === loadUsersAction.userData.username);
                this.buildForm(this.user);
                if (this.projectUuid) {
                    // if a projectUuid exists, add the user to the project
                    const projectIri = this._projectService.uuidToIri(this.projectUuid);
                    this._store.dispatch(new AddUserToProjectMembershipAction(this.user.id, projectIri));
                    this._actions$.pipe(ofActionSuccessful(SetUserAction))
                        .pipe(take(1))
                        .subscribe(() => this._store.dispatch(new LoadProjectMembersAction(projectIri)));
                }

                this.closeDialog.emit(this.user);
                this.loading = false;
            });
    }
}
