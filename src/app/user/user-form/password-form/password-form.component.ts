import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthenticationService } from '@knora/authentication';
import { User, UsersService, Utils, ApiServiceError } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';
import { existingNameValidator, KuiMessageData } from '@knora/action';

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

    form: FormGroup;

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
            required: 'You have to conrim your new password'
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
                    Validators.required,
                    // existingNameValidator(this.newPass)
                    //                    this.checkPasswords(this.newPasswordForm)
                    //                    existingNameValidator(new RegExp('(?:^|\W)' + 'gaga' + '(?:$|\W)'))
                ]
            )
        });
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
