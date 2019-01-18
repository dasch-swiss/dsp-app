import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { existingNamesValidator } from '@knora/action';
import { ApiServiceError, AutocompleteItem, Project, ProjectsService, User, UsersService, Utils } from '@knora/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CacheService } from '../../../main/cache/cache.service';

@Component({
    selector: 'app-select-user',
    templateUrl: './select-user.component.html',
    styleUrls: ['./select-user.component.scss']
})
export class SelectUserComponent implements OnInit {


    /**
     * projectName to get Members of the project
     */
    @Input() projectName: string;

    @Output() userAdded: EventEmitter<any> = new EventEmitter<any>();

    // general stuff
    loading = true;
    errorMessage: any = undefined;

    // form group, errors and validation messages
    selectUserForm: FormGroup;

    selectUserErrors = {
        'username': ''
    };

    // ...and the error hints
    validationMessages = {
        'username': {
            'required': 'Email address is required.',
            'pattern': 'This doesn\'t appear to be a valid email address.',
            'existingName': 'This user is already a member of the project. You can\'t add him.'
        }
    };

    // list of all users
    users: AutocompleteItem[] = [];

    // filter users while typing (autocomplete)
    filteredUsers: Observable<any>;

    // list of users to prevent duplicate entries
    existingUserNames: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible')
    ];

    // user data of selected user
    selectedUser: User;
    isAlreadyMember = false;
    email: string;

    constructor(private _cache: CacheService,
                private _projects: ProjectsService,
                private _users: UsersService,
                private _formBuilder: FormBuilder) {
    }

    ngOnInit() {

        this.buildForm();

    }

    buildForm(): void {

        // set the cache
        const cache = this._cache.get('allUsers', this._users.getAllUsers());

        // get all users; results from cache
        this._cache.get('allUsers', this._users.getAllUsers()).subscribe(
            (response: any) => {

                // if a user is already member of the team, show a hint about it
                const members: string[] = [];

                // empty the list of existingUserNames
                this._cache.get('members_of_' + this.projectName, this._projects.getProjectMembersByShortname(this.projectName));

                // get all members of this project; results from cache
                this._cache.get('members_of_' + this.projectName, this._projects.getProjectMembersByShortname(this.projectName)).subscribe(
                    (res: any) => {
                        for (const m of res) {
                            members.push(m.id);

                            // if the user is already member of the project
                            this.existingUserNames.push(
                                new RegExp('(?:^|\W)' + m.email.toLowerCase() + '(?:$|\W)')
                            );
                        }

                        let i = 1;
                        for (const u of response) {

                            let exists = '';

                            if (members && members.indexOf(u.id) > -1) {
                                exists = '* ';
                            }

                            this.users[i] = {
                                iri: u.id,
                                name: u.email,
                                label: exists + u.givenName + ' ' + u.familyName + ' (' + u.email + ')'
                            };
                            i++;
                        }

                        this.users.sort(function (u1, u2) {
                            if (u1.label < u2.label) {
                                return -1;
                            } else if (u1.label > u2.label) {
                                return 1;
                            } else {
                                return 0;
                            }
                        });
                    },
                    (err: any) => {
                        console.error(err);
                    }
                );

                this.loading = false;

            },
            (error: any) => {
                console.error(error);
            }
        );

        this.selectUserForm = this._formBuilder.group({
            'username': new FormControl({
                value: '', disabled: false
            }, [
                Validators.required,
                Validators.pattern(Utils.RegexEmail),
                existingNamesValidator(this.existingUserNames)
            ])
        });

        this.filteredUsers = this.selectUserForm.controls['username'].valueChanges
            .pipe(
                startWith(this.selectUserForm.controls['username'].value),
                map(user => user ? this.filter(this.users, user) : this.users.slice())
            );

        this.selectUserForm.valueChanges
            .subscribe(data => this.onValueChanged(data));

        this.onValueChanged(); // (re)set validation messages now

    }

    /**
     * filter a list while typing in auto complete input field
     * @param {AutocompleteItem[]} list
     * @param {string} name
     * @returns {AutocompleteItem[]}
     */
    filter(list: AutocompleteItem[], name: string) {
        return list.filter(user =>
            user.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    /**
     * set the error messages on value changed
     *
     * @param data
     */
    onValueChanged(data?: any) {

        if (!this.selectUserForm) {
            return;
        }

        // reset selected user
        this.selectedUser = undefined;

        // check if the form is valid
        Object.keys(this.selectUserErrors).map(field => {
            this.selectUserErrors[field] = '';
            const control = this.selectUserForm.get(field);
            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];
                Object.keys(control.errors).map(key => {
                    this.selectUserErrors[field] += messages[key] + ' ';
                });
            }
        });
    }

    /**
     * set selected user from auto complete
     *
     * @param {string} username
     */
    setSelected() {
        // set selected has four possible scenarios
        // a) the user selected one user from the auto-complete list, which gives us the user's IRI
        // b) the user typed in an eMail address of a new user. It means the user doesn't exist yet
        // c) the user typed in an eMail address of an existing user, but has not selected from the auto-complete list
        // d) the user typed in something else, which is not a valid eMail address,
        //    so the form isn't valid; the method for this case will never start

        const username = this.selectUserForm.controls['username'].value;

        if (this.selectedUser !== undefined) {
            return;
        }

        // which case do we have? option a - d?
        this.email = (username ? username : this.selectUserForm.controls['username'].value);


        // get user by username (email)
        this._users.getUser(this.email)
            .subscribe(
                (result: User) => {
                    // case b) result in case the user exists
                    this.selectedUser = result;

                    // the following request should never start
                    this.isAlreadyMember = (!!result.projects.find(p => p.shortname === this.projectName));

                    if (!this.isAlreadyMember) {

                        // get project iri by projectName
                        this._cache.get(this.projectName).subscribe(
                            (p: Project) => {

                                // add user to project
                                this._users.addUserToProject(this.selectedUser.id, p.id).subscribe(
                                    (add: User) => {

                                        // successful post
                                        // reload the component
                                        this.loading = true;
                                        this.buildForm();
                                        this.userAdded.emit();

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
                    }

                },
                (error: ApiServiceError) => {
                    if (error.status === 404) {
                        // case c) user doesn't exist
                        // create new user user-profile
                        this.selectedUser = new User();

                        this.selectedUser.email = this.email;

                    } else {
                        // api error
                        this.errorMessage = error;
                    }

                }
            );

    }

    resetSelected() {
        this.selectedUser = undefined;
    }

}
