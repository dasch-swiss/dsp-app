import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { existingNamesValidator } from '@knora/action';
import { ApiServiceError, User, UsersService, Utils } from '@knora/core';
import { CacheService } from '../../../main/cache/cache.service';

@Component({
    selector: 'app-user-data',
    templateUrl: './user-data.component.html',
    styleUrls: ['./user-data.component.scss']
})
export class UserDataComponent implements OnInit, OnChanges {

    public readonly RegexUsername = /^[a-zA-Z0-9]+$/;

    /**
     * status for the progress indicator
     */
    loading: boolean = true;

    /**
     * user iri, email or username: in case of edit
     *
     */
    @Input() id?: string;

    /**
     * user data
     */
    user: User;

    /**
     * Is the form a standalone or embedded in a step by step form wizard?
     *
     */
    @Input() standalone = true;

    /**
     *  send user data to parent component;
     *  in case of standalone = false
     */
    @Output() userData = new EventEmitter<User>();


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
     * form group for the form controller
     */
    form: FormGroup;

    /**
     * error checking on the following fields
     */
    formErrors = {
        'givenName': '',
        'familyName': '',
        'email': '',
        'username': '',
        'password': ''
    };

    /**
     * error hints
     */
    validationMessages = {
        'givenName': {
            'required': 'First name is required.'
        },
        'familyName': {
            'required': 'Last name is required.'
        },
        'email': {
            'required': 'Email address is required.',
            'pattern': 'This doesn\'t appear to be a valid email address.',
            'existingName': 'This user exists already. If you want to edit it, ask a system administrator.',
            'member': 'This user is already a member of the project.'
        },
        'username': {
            'required': 'Username is required.',
            'pattern': 'Spaces and special characters are not allowed in username',
            'minlength': 'Username must be at least ' + this.usernameMinLength + ' characters long.',
            'existingName': 'This user exists already. If you want to edit it, ask a system administrator.',
            'member': 'This user is already a member of the project.'
        },
        'password': {
            'required': 'A password is required.',
            'minlength': 'Use at least 8 characters.',
            'pattern': 'The password should have at least one uppercase letter and one number.',
        }
    };

    /**
     * in case of an API error
     */
    errorMessage: any;

    /**
     * password visibility
     */
    showPassword = false;


    /**
     * success of sending data
     */
    success = false;
    /**
     * message after successful post
     */
    successMessage: any = {
        status: 200,
        statusText: 'You have successfully updated the user profile data.'
    };

    /**
     * selector to set default language
     */
    languagesList: any[] = [
        {
            id: 'en',
            name: 'english'
        },
        {
            id: 'de',
            name: 'deutsch'
        },
        {
            id: 'fr',
            name: 'français'
        },
        {
            id: 'it',
            name: 'italiano'
        }
    ];

    constructor(private _route: ActivatedRoute,
                private _cache: CacheService,
                private _users: UsersService,
                private _formBuilder: FormBuilder) {
    }

    ngOnInit() {

        this.loading = true;

        if (this.id) {
            /**
             * edit mode: get user data from cache
             */
            this._cache.get(this.id, this._users.getUserByIri(this.id)).subscribe(
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
            // get existing users to avoid same usernames and email addresses
            this._cache.get('allUsers', this._users.getAllUsers())
                .subscribe(
                    (result: User[]) => {

                        for (const user of result) {
                            // The email address of the user should be unique.
                            // Therefore we create a list of existing email addresses to avoid multiple use of user names
                            this.existingEmails.push(
                                new RegExp('(?:^|\W)' + user.email.toLowerCase() + '(?:$|\W)')
                            );
                            // The username should also be unique.
                            // Therefore we create a list of existingUsernames to avoid multiple use of user names
                            this.existingUsernames.push(
                                new RegExp('(?:^|\W)' + user.username.toLowerCase() + '(?:$|\W)')
                            );
                        }

                        this.loading = !this.buildForm(new User());
                    }
                );
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

        // if user is defined, we're in the edit mode
        // otherwise "create new user" mode is active
        const editMode: boolean = (!!user.id);

        this.form = this._formBuilder.group({
            'givenName': new FormControl({
                value: user.givenName, disabled: false
            }, [
                Validators.required
            ]),
            'familyName': new FormControl({
                value: user.familyName, disabled: false
            }, [
                Validators.required
            ]),
            'email': new FormControl({
                value: user.email, disabled: editMode
            }, [
                Validators.required,
                Validators.pattern(Utils.RegexEmail),
                existingNamesValidator(this.existingEmails)
            ]),
            'username': new FormControl({
                value: user.username, disabled: editMode
            }, [
                Validators.required,
                Validators.minLength(4),
                Validators.pattern(this.RegexUsername),
                existingNamesValidator(this.existingUsernames)
            ]),
            'password': new FormControl({
                value: user.password, disabled: editMode
            }, [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(Utils.RegexPassword)
            ]),
            'lang': new FormControl({
                value: (user.lang ? user.lang : 'en'), disabled: false
            })
            //            'status': user.userData.status,
            //            'systemAdmin': this.sysAdminPermission,
            //            'group': null
        });

        //        this.loading = false;


        this.form.valueChanges
            .subscribe(data => this.onValueChanged(data));

        //        this.onValueChanged(); // (re)set validation messages now

        return true;

    }

    /**
     *
     * @param data
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

    /**
     * toggle the visibility of the password
     */
    toggleVisibility() {
        this.showPassword = (!this.showPassword);
    }

    /**
     *
     */
    submitData(): void {

        if (this.standalone) {
            this.loading = true;
            // this method is only used in standalone user data form
            // to edit user user-profile
            this._users.updateUser(this.user.id, this.form.value).subscribe(
                (result: User) => {
                    this.user = result;
                    this.buildForm(this.user);
                    this.loading = false;
                    this.success = true;
                },
                (error: ApiServiceError) => {
                    this.errorMessage = error;
                    this.loading = false;
                    this.success = false;
                }
            );
        } else {
            this.userData.emit(this.form.value);
        }
    }

}
