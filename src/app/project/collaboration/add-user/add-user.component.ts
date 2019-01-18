import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { existingNamesValidator } from '@knora/action';
import { ApiServiceError, AutocompleteItem, Project, ProjectsService, Session, User, UsersService } from '@knora/core';
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
    filteredUsers: Observable<AutocompleteItem[]>;

    /**
     * list of usernames to prevent duplicate entries
     */
    existingUsernames: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible')
    ];
    /**
     * list of usernames of project members to prevent duplicate entries
     */
    existingUsernameInProject: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible')
    ];

    /**
     * list of emails to prevent duplicate entries
     */
    existingEmails: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible')
    ];

    /**
     * list of emails of project members to prevent duplicate entries
     */
    existingEmailInProject: [RegExp] = [
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
                private _router: Router,
                private _projects: ProjectsService,
                private _users: UsersService,
                private _formBuilder: FormBuilder) {
    }

    ngOnInit() {

        // build the form
        this.buildForm();
    }

    buildForm(): void {

        // clean autocomplete list
        this.users = [];

        // set the cache
        this._cache.get('allUsers', this._users.getAllUsers());

        // get all users; results from cache
        this._cache.get('allUsers', this._users.getAllUsers()).subscribe(
            (response: any) => {

                // if a user is already member of the team, mark it in the list
                const members: string[] = [];

                // empty the list of existingUserNames
                this._cache.del('members_of_' + this.projectcode);
                this._cache.get('members_of_' + this.projectcode, this._projects.getProjectMembersByShortcode(this.projectcode));

                // get all members of this project; results from cache
                this._cache.get('members_of_' + this.projectcode, this._projects.getProjectMembersByShortcode(this.projectcode)).subscribe(
                    (res: any) => {
                        for (const m of res) {
                            members.push(m.id);

                            // if the user is already member of the project
                            // add the email to the list of existing
                            this.existingEmailInProject.push(
                                new RegExp('(?:^|\W)' + m.email.toLowerCase() + '(?:$|\W)')
                            );
                            // add username to the list of existing
                            this.existingUsernameInProject.push(
                                new RegExp('(?:^|\W)' + m.username.toLowerCase() + '(?:$|\W)')
                            );
                        }

                        let i: number = 0;
                        for (const u of response) {

                            // if the user is already member of the project
                            // add the email to the list of existing
                            this.existingEmails.push(
                                new RegExp('(?:^|\W)' + u.email.toLowerCase() + '(?:$|\W)')
                            );
                            // add username to the list of existing
                            this.existingUsernames.push(
                                new RegExp('(?:^|\W)' + u.username.toLowerCase() + '(?:$|\W)')
                            );

                            let existsInProject: string = '';

                            if (members && members.indexOf(u.id) > -1) {
                                existsInProject = '* ';
                            }

                            this.users[i] = {
                                iri: u.id,
                                name: u.email,
                                label: existsInProject + u.username + ' | ' + u.email + ' | ' + u.givenName + ' ' + u.familyName
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
                existingNamesValidator(this.existingUsernames),
                existingNamesValidator(this.existingUsernameInProject),
                existingNamesValidator(this.existingEmails),
                existingNamesValidator(this.existingEmailInProject)
            ])
        });

        this.filteredUsers = this.selectUserForm.controls['username'].valueChanges
            .pipe(
                startWith(''),
                map(user => user.length >= 2 ? this.filter(this.users, user) : [])
            );

        this.selectUserForm.valueChanges
            .subscribe(data => this.onValueChanged(data));

        this.onValueChanged(); // (re)set validation messages now

    }


    /**
     * filter a list while typing in auto complete input field
     * @param {AutocompleteItem[]} list List of options
     * @param {string} name Value to filter by
     * @returns {AutocompleteItem[]} Filtered list of options
     */
    filter(list: AutocompleteItem[], name: string) {
        return list.filter(user =>
            user.label.toLowerCase().includes(name.toLowerCase())
        );
    }


    /**
     * set the error messages on value changed
     *
     * @param (data)
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
            if (control.value.length >= 2) {
                if (control && control.dirty && !control.valid) {
                    const messages = this.validationMessages[field];
                    Object.keys(control.errors).map(key => {
                        this.selectUserErrors[field] += messages[key] + ' ';
                    });
                }
            }

        });
    }

    /**
     * Add user to the project
     *
     * @param val The value can be e-mail address or username
     */
    addUser(val: string) {

        this._users.getUser(val).subscribe(
            (result: User) => {
                // case b) result if the user exists
                this.selectedUser = result;

                // the following request should never start
                this.isAlreadyMember = (!!result.projects.find(p => p.shortcode === this.projectcode));

                if (!this.isAlreadyMember) {

                    this.loading = true;

                    // get project iri by projectcode
                    this._cache.get(this.projectcode).subscribe(
                        (p: Project) => {
                            // add user to project
                            this._users.addUserToProject(this.selectedUser.id, p.id).subscribe(
                                (add: User) => {

                                    // successful post
                                    // reload the component
                                    this.buildForm();
                                    this.refreshParent.emit();

                                    // update own user profile, if the added user is the same as the logged-in user
                                    // get logged-in user name
                                    const session: Session = JSON.parse(localStorage.getItem('session'));
                                    if (add.username === session.user.name) {
                                        this._cache.del(add.username);
                                        this._cache.get(add.username, this._users.getUser(add.username));
                                    }
                                    this.loading = false;

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

    createUser() {
        this._router.navigate(['/user/new'], {
            queryParams: {
                returnUrl: this._router.url,
                project: this.projectcode,
                value: this.selectUserForm.controls['username'].value
            }
        });
    }

    resetInput(ev: Event) {
        ev.preventDefault();
        this.selectUserForm.controls['username'].reset('');
    }

}
