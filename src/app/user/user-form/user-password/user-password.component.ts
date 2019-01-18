import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiServiceError, User, UsersService, Utils } from '@knora/core';

@Component({
    selector: 'app-user-password',
    templateUrl: './user-password.component.html',
    styleUrls: ['./user-password.component.scss']
})
export class UserPasswordComponent implements OnInit {

    @Input() username: string;

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

    loggedInUser: any;

    // show the content after every service has loaded and the data is ready
    loading = true;

    userPasswordForm: FormGroup;
    newPasswordForm: FormGroup;
    requesterPasswordForm: FormGroup;

    pswdData: any = {};

    // error checking on the following fields
    formErrors = {
        'requesterPassword': '',
        'newPassword': ''
    };

    // ...and the error hints
    validationMessages = {
        'requesterPassword': {
            'required': 'The old password is required'
        },
        'newPassword': {
            'required': 'A new password is needed, if you want to change it.',
            'minlength': 'Use at least 8 characters.',
            'pattern': 'The password should have at least one uppercase letter and one number.'
        }
    };


    constructor(private _usersService: UsersService,
        private _formBuilder: FormBuilder) {
    }

    ngOnInit() {

        this.userPasswordForm = this._formBuilder.group({
            'requesterPassword': new FormControl({
                value: '', disabled: false
            }, [
                    Validators.required
                ]),
            'newPassword': new FormControl({
                value: '', disabled: false
            }, [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.pattern(Utils.RegexPassword)

                ])
        });
        this.requesterPasswordForm = this._formBuilder.group({
            'requesterPassword': new FormControl({
                value: '', disabled: false
            }, [
                Validators.required
            ])
        });

        this.newPasswordForm = this._formBuilder.group({
            'newPassword': new FormControl({
                value: '', disabled: false
            }, [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(Utils.RegexPassword)
            ])
        });

        this.userPasswordForm.valueChanges
            .subscribe(data => this.onValueChanged(this.userPasswordForm, data));
        this.newPasswordForm.valueChanges
            .subscribe(data => this.onValueChanged(this.newPasswordForm, data));
        this.requesterPasswordForm.valueChanges
            .subscribe(data => this.onValueChanged(this.requesterPasswordForm, data));

        this.onValueChanged(this.userPasswordForm); // (re)set validation messages now
        this.onValueChanged(this.newPasswordForm); // (re)set validation messages now
        this.onValueChanged(this.requesterPasswordForm); // (re)set validation messages now

        this.loading = false;

        // get the user data only if a user is logged in
        this.loggedInUser = JSON.parse(localStorage.getItem('session')).user;


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
            this.showOldPassword = (!this.showOldPassword);
        } else {
            this.showNewPassword = (!this.showNewPassword);
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

        this.oldPswd = !this.oldPswd;

    }

    submitSysAdminData(): void {
        // reset old messages
        this.oldPasswordIsWrong = false;

        this.loading = true;

        const requesterPassword = this.requesterPasswordForm.value.requesterPassword;
        const newPassword = this.newPasswordForm.value.newPassword;

        this.pswdData = {
            requesterPassword,
            newPassword
        };

        // console.log(this.userIri);
        // console.log(this.requesterPasswordForm.value);
        // console.log(this.pswdData);
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

        this.oldPswd = !this.oldPswd;

    }

}
