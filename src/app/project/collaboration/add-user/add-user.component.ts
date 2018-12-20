import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { existingNamesValidator } from '@knora/action';
import { ApiServiceError, AutocompleteItem, Project, ProjectsService, User, UsersService, Utils } from '@knora/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CacheService } from '../../../main/cache/cache.service';

@Component({
    selector: 'app-add-user',
    templateUrl: './add-user.component.html',
    styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {

    /**
     * status for the progress indicator
     */
    loading: boolean = true;

    /**
     * project name to get existing team members
     * or to know where to add selected user
     */
    @Input() projectcode: string;

    /**
     * event emitter, when the selected user will be added to the list
     */
    @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

    /**
     * form group
     */
    selectUserForm: FormGroup;

    /**
     * form errors
     */
    selectUserErrors = {
        'username': ''
    };

    /**
     * form error hints
     */
    validationMessages = {
        'username': {
            'existingName': 'This user is already a member of the project. You can\'t add him.'
        }
    };

    /**
     * message in case of an API error
     */
    errorMessage: any = undefined;

    /**
     * list of all users
     */
    users: AutocompleteItem[] = [];

    /**
     * filter users while typing (autocomplete)
     */
    filteredUsers: Observable<any>;

    /**
     * list of usernames to prevent duplicate entries
     */
    existingUsernames: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible')
    ];

    /**
     * list of emails to prevent duplicate entries
     */
    existingEmails: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible')
    ];

    /**
     * selected user object
     */
    selectedUser: User;

    /**
     * member status of selected user
     */
    isAlreadyMember = false;

    constructor(private _cache: CacheService,
                private _projects: ProjectsService,
                private _users: UsersService,
                private _formBuilder: FormBuilder) {
    }

    ngOnInit() {

        /**
         * build form on start
         */
        this.buildForm();
    }

    buildForm(): void {

        // set the cache
        this._cache.get('allUsers', this._users.getAllUsers());

        // get all users; results from cache
        this._cache.get('allUsers', this._users.getAllUsers()).subscribe(
            (response: any) => {

                // if a user is already member of the team, mark it in the list
                const members: string[] = [];

                // empty the list of existingUserNames
                this._cache.get('members_of_' + this.projectcode, this._projects.getProjectMembersByShortcode(this.projectcode));

                // get all members of this project; results from cache
                this._cache.get('members_of_' + this.projectcode, this._projects.getProjectMembersByShortcode(this.projectcode)).subscribe(
                    (res: any) => {
                        for (const m of res) {
                            members.push(m.id);

                            // if the user is already member of the project
                            // add the email to the list of existing
                            this.existingEmails.push(
                                new RegExp('(?:^|\W)' + m.email.toLowerCase() + '(?:$|\W)')
                            );
                            // add username to the list of existing
                            this.existingUsernames.push(
                                new RegExp('(?:^|\W)' + m.username.toLowerCase() + '(?:$|\W)')
                            );
                        }

                        let i: number = 1;
                        for (const u of response) {

                            let exists: string = '';

                            if (members && members.indexOf(u.id) > -1) {
                                exists = '* ';
                            }

                            this.users[i] = {
                                iri: u.id,
                                name: u.email,
                                label: exists + u.username + ' | ' + u.email + ' | ' + u.givenName + ' ' + u.familyName
                            };
                            i++;
                        }

                        this.users.sort(function (u1: AutocompleteItem, u2: AutocompleteItem) {
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
//                Validators.required,
//                Validators.pattern(Utils.RegexEmail),
                existingNamesValidator(this.existingUsernames),
                existingNamesValidator(this.existingEmails)
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
            user.label.toLowerCase().includes(name.toLowerCase())
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
     */
    setSelected() {


        // set selected has four possible scenarios
        // a) the user selected one user from the auto-complete list, which gives us the user's IRI
        // b) the user typed in an eMail address or username of a new user. It means the user doesn't exist yet
        // c) the user typed in an eMail address of an existing user, but has not selected from the auto-complete list
        // d) the user typed in something else, which is not a valid eMail address or valid username,
        //    so the form isn't valid; the method for this case will never start

        const username = this.selectUserForm.controls['username'].value;

        if (this.selectedUser !== undefined) {
            return;
        }

        console.log((username ? username : this.selectUserForm.controls['username'].value));

        // which case do we have? option a - d?
        const email = (username ? username : this.selectUserForm.controls['username'].value);


        // get user by username (email)
        this._users.getUser(email)
            .subscribe(
                (result: User) => {
                    // case b) result in case the user exists
                    this.selectedUser = result;

                    // the following request should never start
                    this.isAlreadyMember = (!!result.projects.find(p => p.shortcode === this.projectcode));

                    if (!this.isAlreadyMember) {

                        // get project iri by projectName
                        this._cache.get(this.projectcode).subscribe(
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

                        this.selectedUser.email = email;

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

    /**
     *
     *
     * @param val The value can be e-mail address or username
     */
    addUser(val: string) {
        this._users.getUser(val).subscribe(
            (result: User) => {
                // case b) result in case the user exists
                this.selectedUser = result;

                // the following request should never start
                this.isAlreadyMember = (!!result.projects.find(p => p.shortcode === this.projectcode));

                if (!this.isAlreadyMember) {

                    // get project iri by projectName
                    this._cache.get(this.projectcode).subscribe(
                        (p: Project) => {

                            // add user to project
                            this._users.addUserToProject(this.selectedUser.id, p.id).subscribe(
                                (add: User) => {

                                    // successful post
                                    // reload the component
                                    this.loading = true;
                                    this.buildForm();
                                    this.refreshParent.emit();

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

                    this.selectedUser.email = val;

                } else {
                    // api error
                    this.errorMessage = error;
                }

            }
        );
    }

    resetInput(ev: Event) {
        ev.preventDefault();
        this.selectUserForm.controls['username'].reset('');
    }

}
