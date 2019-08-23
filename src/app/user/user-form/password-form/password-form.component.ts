import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthenticationService } from '@knora/authentication';
import { User, UsersService, Utils, ApiServiceError } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';
import { existingNameValidator, KuiMessageData } from '@knora/action';

export class PasswordValidator {
    // inspired on: http://plnkr.co/edit/Zcbg2T3tOxYmhxs7vaAm?p=preview
    static areEqual(formGroup: FormGroup) {
        let value;
        let valid = true;
        for (let key in formGroup.controls) {

            console.log('key', key);

            if (formGroup.controls.hasOwnProperty(key)) {
                let control: FormControl = <FormControl>formGroup.controls[key];

                if (value === undefined) {
                    value = control.value
                } else {
                    if (value !== control.value) {
                        valid = false;
                        break;
                    }
                }
            }
        }

        if (valid) {
            return null;
        }

        return {
            areEqual: true
        };
    }
}

@Component({
    selector: 'app-password-form',
    templateUrl: './password-form.component.html',
    styleUrls: ['./password-form.component.scss']
})
export class PasswordFormComponent implements OnInit {

    // progress indicator
    loading: boolean;
    // in case of an api error
    errorMessage: ApiServiceError;

    // in case of updating data: was it succesful or does it failed
    apiResponse: KuiMessageData;

    // update password for:
    @Input() username: string;
    user: User;

    // who is logged in?
    loggedInUserName: string;
    // update own password?
    updateOwn: boolean;

    // password form
    form: FormGroup;

    matchingPasswords: boolean = false;

    // in case of change not own password, we need a sys admin confirm password form
    confirmForm: FormGroup;

    // error checking on the following fields
    formErrors = {
        requesterPassword: '',
        password: '',
        confirmPassword: ''
    };

    // ...and the error hints
    validationMessages = {
        requesterPassword: {
            required: 'The old password is required'
        },
        password: {
            required: 'A new password is needed, if you want to change it.',
            minlength: 'Use at least 8 characters.',
            pattern:
                'The password should have at least one uppercase letter and one number.'
        },
        confirmPassword: {
            required: 'You have to confirm your password',
            match: 'Password mismatch'
        }
    };

    // visibility of password
    showRequesterPassword = false;
    showPassword = false;
    showConfirmPassword = false;

    constructor (
        private _cache: CacheService,
        private _auth: AuthenticationService,
        private _usersService: UsersService,
        private _fb: FormBuilder
    ) { }

    ngOnInit() {
        const session = JSON.parse(localStorage.getItem('session'));

        this.loggedInUserName = session.user.name;

        if (this.loggedInUserName === this.username) {
            // update own password
            this.updateOwn = true;
        } else {
            // update not own password, if logged-in user is system admin
            if (session.user.sysAdmin) {
                this.updateOwn = false;
                this._cache.get(
                    this.username,
                    this._usersService.getUserByUsername(this.username)
                );
            }
        }


        // set/get cached user data
        this._cache.get(this.username, this._usersService.getUserByUsername(this.username));

        this._cache.get(this.username, this._usersService.getUserByUsername(this.username)).subscribe(
            (response: User) => {
                this.user = response;
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        );

        this.buildForm();


    }

    buildForm() {

        this.form = this._fb.group({
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
            password: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.pattern(Utils.RegexPassword)
                ]
            ),
            confirmPassword: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                [
                    Validators.required
                    // existingNameValidator(this.newPass)
                    //                    this.checkPasswords(this.newPasswordForm)
                    //                    existingNameValidator(new RegExp('(?:^|\W)' + 'gaga' + '(?:$|\W)'))
                ]
            )
        });

        this.form.valueChanges.subscribe(data => {
            //            this.newPass = new RegExp('(?:^|\W)' + this.userPasswordForm.controls.newPassword.value + '(?:$|\W)');
            this.onValueChanged(this.form, data);
            // this.comparePasswords(data.)
            // compare passwords here
            if (this.form.controls.password.dirty && this.form.controls.confirmPassword.dirty && (this.form.controls.password.value !== this.form.controls.confirmPassword.value)) {

                this.formErrors['confirmPassword'] = this.validationMessages['confirmPassword'].match;

                this.matchingPasswords = true;
                // form.get('confirmPassword').setValidators(false); // = !form.get('confirmPassword').valid;
            }
        });

        this.onValueChanged(this.form); // (re)set validation messages now
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

    comparePasswords(pw_1: string, pw_2: string) {

        if (this.form.controls.password.dirty && this.form.controls.confirmPassword.dirty) {
            // compare password field values:
            if (this.form.controls.password.value !== this.form.controls.confirmPassword.value) {

                this.formErrors['confirmPassword'] = this.validationMessages['confirmPassword'].match;
                console.log(this.formErrors['confirmPassword']);
            }
        }
    }

    submtiData() {

    }

    closeMessage(status?: number) {

        switch (status) {
            case 200:
                // success: close message (and dialog box)
                break;

            case 400:
                // something went wrong: reset form
                break;

            default:
            // close message

        }

    }

}
