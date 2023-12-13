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
import {
    ApiResponseError,
    KnoraApiConnection,
    ReadUser,
    User,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { CustomRegex } from '@dsp-app/src/app/workspace/resource/values/custom-regex';
import { Store } from '@ngxs/store';

@Component({
    selector: 'app-password-form',
    templateUrl: './password-form.component.html',
    styleUrls: ['./password-form.component.scss'],
})
export class PasswordFormComponent implements OnInit {
    // update password for:
    @Input() user: ReadUser;

    // output to close dialog
    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    // in case of child component inside parent form
    @Output() sendToParent: EventEmitter<string> = new EventEmitter<string>();

    // progress indicator and error status
    loading: boolean;
    error: boolean;

    // update own password?
    updateOwn: boolean;

    // depending on updateOwn: showPasswordForm or showConfirmForm
    showPasswordForm: boolean;

    // password form
    form: UntypedFormGroup;

    matchingPasswords = false;

    // in case of change not own password, we need a sys admin confirm password form
    confirmForm: UntypedFormGroup;

    // error checking on the following fields
    formErrors = {
        requesterPassword: '',
        password: '',
        confirmPassword: '',
    };

    // ...and the error hints
    validationMessages = {
        requesterPassword: {
            required: 'The old password is required',
        },
        password: {
            required: 'Password is required.',
            minlength: 'Use at least 8 characters.',
            pattern:
                'The password should have at least one uppercase letter and one number.',
        },
        confirmPassword: {
            required: 'You have to confirm your password.',
            match: 'Password mismatch.',
        },
    };

    // visibility of password
    showRequesterPassword = false;
    showPassword = false;
    showConfirmPassword = false;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: AppErrorHandler,
        private _fb: UntypedFormBuilder,
        private _notification: NotificationService,
        private store: Store,
    ) {}

    ngOnInit() {
        const usernameFromState = this.store.selectSnapshot(UserSelectors.username);
        const userFromState = this.store.selectSnapshot(UserSelectors.user) as User;
        if (this.user) {
            // edit mode
            if (usernameFromState === this.user.username) {
                // update own password
                this.updateOwn = true;
            } else {
                // update not own password, if logged-in user is system admin
                if (userFromState.systemAdmin) {
                    this.updateOwn = false;
                }
            }
            this.showPasswordForm = this.updateOwn;
            this.updateOwn ? this.buildForm() : this.buildConfirmForm();
        } else {
            // create new password
            this.updateOwn = false;
            this.showPasswordForm = true;
            this.buildForm();
        }
    }

    buildConfirmForm() {
        this.confirmForm = this._fb.group({
            requesterPassword: new UntypedFormControl(
                {
                    value: '',
                    disabled: false,
                },
                [Validators.required]
            ),
        });

        this.confirmForm.valueChanges.subscribe(() => {
            this.onValueChanged(this.confirmForm);
        });

        this.onValueChanged(this.confirmForm); // (re)set validation messages now

        this.loading = false;
    }

    buildForm() {
        const requesterPassword =
            this.updateOwn || !this.confirmForm
                ? ''
                : this.confirmForm.controls.requesterPassword.value;

        const name = this.user?.username ? this.user.username : '';

        this.form = this._fb.group({
            username: new UntypedFormControl({
                value: name,
                disabled: !this.user,
            }),
            requesterPassword: new UntypedFormControl(
                {
                    value: requesterPassword,
                    disabled: false,
                },
                [Validators.required]
            ),
            password: new UntypedFormControl(
                {
                    value: '',
                    disabled: false,
                },
                [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.pattern(CustomRegex.PASSWORD_REGEX),
                ]
            ),
            confirmPassword: new UntypedFormControl(
                {
                    value: '',
                    disabled: false,
                },
                [Validators.required]
            ),
        });

        this.form.valueChanges.subscribe(() => {
            this.onValueChanged(this.form);

            // compare passwords here
            if (
                this.form.controls.password.dirty &&
                this.form.controls.confirmPassword.dirty
            ) {
                this.matchingPasswords =
                    this.form.controls.password.value ===
                    this.form.controls.confirmPassword.value;

                this.formErrors['confirmPassword'] += this.matchingPasswords
                    ? ''
                    : this.validationMessages['confirmPassword'].match;
            }

            if (
                this.matchingPasswords &&
                !this.formErrors['password'] &&
                !this.formErrors['confirmPassword']
            ) {
                this.sendToParent.emit(this.form.controls.password.value);
            } else {
                this.sendToParent.emit('');
            }
        });

        this.onValueChanged(this.form); // (re)set validation messages now

        this.loading = false;
    }

    onValueChanged(form: UntypedFormGroup) {
        // const form = this.userPasswordForm;

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

    // confirm sys admin
    nextStep() {
        this.loading = true;

        // submit requester password with logged-in username
        this._dspApiConnection.v2.auth
            .login(
                'username',
                this.store.selectSnapshot(UserSelectors.username),
                this.confirmForm.controls.requesterPassword.value
            )
            .subscribe(
                () => {
                    // go to next step with password form
                    this.showPasswordForm = !this.showPasswordForm;
                    // this.requesterPass = this.confirmForm.controls.requesterPassword.value;
                    this.buildForm();
                    this.loading = false;
                },
                () => {
                    this.confirmForm.controls.requesterPassword.setErrors({
                        incorrectPassword: true,
                    });
                    this.loading = false;
                    this.error = true;
                }
            );
    }

    submitData() {
        this.loading = true;

        const requesterPassword = this.updateOwn
            ? this.form.controls.requesterPassword.value
            : this.confirmForm.controls.requesterPassword.value;

        this._dspApiConnection.admin.usersEndpoint
            .updateUserPassword(
                this.user.id,
                requesterPassword,
                this.form.controls.password.value
            )
            .subscribe(
                () => {
                    const successResponse =
                        'You have successfully updated ' +
                        (this.updateOwn ? 'your' : "user's") +
                        ' password.';
                    this._notification.openSnackBar(successResponse);
                    this.closeDialog.emit();
                    this.form.reset();
                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    if (error.status === 403) {
                        // incorrect old password
                        this.form.controls.requesterPassword.setErrors({
                            incorrectPassword: true,
                        });
                    } else {
                        this._errorHandler.showMessage(error);
                    }
                    this.loading = false;
                    this.error = true;
                }
            );
    }
}
