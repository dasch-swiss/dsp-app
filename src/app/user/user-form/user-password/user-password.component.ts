import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    Validators
} from '@angular/forms';
import { ApiServiceError, User, UsersService, Utils } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';

@Component({
    selector: 'app-user-password',
    templateUrl: './user-password.component.html',
    styleUrls: ['./user-password.component.scss']
})
export class UserPasswordComponent implements OnInit {

    @Input() username: string;

    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    loggedInUserName: string;

    user: User;

    // visibility of password
    showOldPassword = false;
    showNewPassword = false;
    oldPswd = true;

    // in case of an API error
    errorMessage: any;

    // in case if the old password is wrong
    oldPasswordIsWrong = false;
    oldPasswordError = 'The old password is not correct';

    // in case of success:
    success = false;
    successMessage: any = {
        status: 200,
        statusText: 'You have successfully changed your password.'
    };

    // do you want to update your own password?
    updateOwnPassword: boolean;

    // show the content after every service has loaded and the data is ready
    loading = true;

    userPasswordForm: FormGroup;
    newPasswordForm: FormGroup;
    requesterPasswordForm: FormGroup;

    pswdData: any = {};

    // error checking on the following fields
    formErrors = {
        requesterPassword: '',
        newPassword: ''
    };

    // ...and the error hints
    validationMessages = {
        requesterPassword: {
            required: 'The old password is required'
        },
        newPassword: {
            required: 'A new password is needed, if you want to change it.',
            minlength: 'Use at least 8 characters.',
            pattern:
                'The password should have at least one uppercase letter and one number.'
        }
    };

    constructor(
        private _cache: CacheService,
        private _usersService: UsersService,
        private _formBuilder: FormBuilder
    ) {}

    ngOnInit() {

        const session = JSON.parse(localStorage.getItem('session'));

        this.loggedInUserName = session.user.name;

        if (this.loggedInUserName === this.username) {
            // update own password
            this.updateOwnPassword = true;
        } else {
            // update not own password, if logged-in user is system admin
            if (session.user.sysAdmin) {
                this.updateOwnPassword = false;
                this._cache.get(
                    this.username,
                    this._usersService.getUserByUsername(this.username)
                );
            }
        }



        this._cache
            .get(
                this.username,
                this._usersService.getUserByUsername(this.username)
            )
            .subscribe(
                (response: User) => {
                    this.user = response;
                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );
        // form to change own password
        this.userPasswordForm = this._formBuilder.group({
            username: new FormControl({
                value: this.username,
                disabled: true
            }),
            requesterPassword: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                [Validators.required]
            ),
            newPassword: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.pattern(Utils.RegexPassword)
                ]
            )
        });

        // form to submit system admin password
        this.requesterPasswordForm = this._formBuilder.group({
            requesterPassword: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                [Validators.required]
            )
        });

        // form to change other user's password
        this.newPasswordForm = this._formBuilder.group({
            username: new FormControl({
                value: this.username,
                disabled: true
            }),
            newPassword: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.pattern(Utils.RegexPassword)
                ]
            )
        });

        this.userPasswordForm.valueChanges.subscribe(data =>
            this.onValueChanged(this.userPasswordForm, data)
        );
        this.newPasswordForm.valueChanges.subscribe(data =>
            this.onValueChanged(this.newPasswordForm, data)
        );
        this.requesterPasswordForm.valueChanges.subscribe(data =>
            this.onValueChanged(this.requesterPasswordForm, data)
        );

        this.onValueChanged(this.userPasswordForm); // (re)set validation messages now
        this.onValueChanged(this.newPasswordForm); // (re)set validation messages now
        this.onValueChanged(this.requesterPasswordForm); // (re)set validation messages now

        this.loading = false;

        // get the user data only if a user is logged in
        // this.loggedInUser = JSON.parse(localStorage.getItem('session')).user;
    }

    onValueChanged(form: FormGroup, data?: any) {
        // const form = this.userPasswordForm;

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

    /**
     * toggle the visibility of the password
     */
    toggleVisibility(ev: Event, password: string) {
        ev.preventDefault();

        if (password === 'old') {
            this.showOldPassword = !this.showOldPassword;
        } else {
            this.showNewPassword = !this.showNewPassword;
        }
    }

    /**
     *Save new password goes to the next div, to check sys admin password and then submit
     */
    savePswd() {
        this.oldPswd = !this.oldPswd;
    }

    /**
     *
     */
    submitData(): void {
        // reset old messages
        this.oldPasswordIsWrong = false;

        this.loading = true;

        if (this.updateOwnPassword) {
            this._usersService
                .updateOwnPassword(
                    this.user.id,
                    this.userPasswordForm.controls['requesterPassword'].value,
                    this.userPasswordForm.controls['newPassword'].value
                )
                .subscribe(
                    (result: User) => {
                        // console.log(this.userPasswordForm.value);
                        this.success = true;
                        this.loading = false;
                    },
                    (error: ApiServiceError) => {
                        if (error.status === 403) {
                            // the old password is wrong
                            this.oldPasswordIsWrong = true;
                            this.success = false;
                        } else {
                            this.errorMessage = error;
                        }

                        this.loading = false;
                    }
                );
        } else {
            this._usersService
                .updateOwnPassword(
                    this.user.id,
                    this.requesterPasswordForm.controls['requesterPassword'].value,
                    this.newPasswordForm.controls['newPassword'].value
                )
                .subscribe(
                    (result: User) => {
                        // console.log(this.userPasswordForm.value);
                        this.success = true;
                        this.loading = false;
                    },
                    (error: ApiServiceError) => {
                        if (error.status === 403) {
                            // the old password is wrong
                            this.oldPasswordIsWrong = true;
                            this.success = false;
                        } else {
                            this.errorMessage = error;
                        }

                        this.loading = false;
                    }
                );
        }
        // TODO: updateUser doesn't exist anymore in user service
        // TODO: fix update password for own user and for other users
        /*
        this._usersService.updateUser(this.username, this.userPasswordForm.value).subscribe(
            (result: User) => {
                // console.log(this.userPasswordForm.value);
                this.success = true;
                this.loading = false;
            },
            (error: ApiServiceError) => {

                if (error.status === 403) {
                    // the old password is wrong
                    this.oldPasswordIsWrong = true;
                    this.success = false;
                } else {
                    this.errorMessage = error;
                }

                this.loading = false;
            }
        );
        */

        this.oldPswd = !this.oldPswd;
    }

    submitSysAdminData(): void {
        // reset old messages
        this.oldPasswordIsWrong = false;

        this.loading = true;

        const requesterPassword = this.requesterPasswordForm.value
            .requesterPassword;
        const newPassword = this.newPasswordForm.value.newPassword;

        this.pswdData = {
            requesterPassword,
            newPassword
        };

        // console.log(this.userIri);
        // console.log(this.requesterPasswordForm.value);
        // console.log(this.pswdData);
        // TODO: update user doesn't exist anymore in user service
        // TODO: fix update password for own user and for other users
        /*
        this._usersService.updateUser(this.username, this.pswdData).subscribe(
            (result: User) => {
                // console.log(result);
                this.success = true;
                this.loading = false;
            },
            (error: ApiServiceError) => {

                if (error.status === 403) {
                    // the old password is wrong
                    this.oldPasswordIsWrong = true;
                    this.success = false;
                } else {
                    this.errorMessage = error;
                }

                this.loading = false;
            }
        );
        */

        this.oldPswd = !this.oldPswd;
    }

    closeMessage() {
        this.closeDialog.emit();
    }
}
