import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  ApiResponseData,
  ApiResponseError,
  KnoraApiConnection,
  ReadUser,
  UserResponse,
  UsersResponse,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, DspDialogConfig } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { ProjectsSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { existingNamesValidator } from '../../../main/directive/existing-name/existing-names.validator';
import { CreateUserPageComponent } from '../../../user/create-user-page/create-user-page.component';
import { AutocompleteItem } from '../../../workspace/search/operator';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
})
export class AddUserComponent implements OnInit {
  /**
   * project uuid to get existing team members
   * or to know where to add selected user
   */
  @Input() projectUuid: string;

  /**
   * event emitter, when the selected user will be added to the list
   */
  @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

  /**
   * status for the progress indicator
   */
  loading = true;

  /**
   * form group
   */
  selectUserForm: UntypedFormGroup;

  /**
   * form errors
   */
  selectUserErrors = {
    username: '',
  };

  /**
   * form error hints
   */
  validationMessages = {
    username: {
      existingName: "This user is already a member of the project. You can't add him / her.",
    },
  };

  /**
   * list of all users
   */
  users: AutocompleteItem[] = [];

  /**
   * filter users while typing (autocomplete)
   */
  filteredUsers$: Observable<AutocompleteItem[]>;

  /**
   * list of usernames to prevent duplicate entries
   */
  existingUsernames: [RegExp] = [new RegExp('anEmptyRegularExpressionWasntPossible')];
  /**
   * list of usernames of project members to prevent duplicate entries
   */
  existingUsernameInProject: [RegExp] = [new RegExp('anEmptyRegularExpressionWasntPossible')];

  /**
   * list of emails to prevent duplicate entries
   */
  existingEmails: [RegExp] = [new RegExp('anEmptyRegularExpressionWasntPossible')];

  /**
   * list of emails of project members to prevent duplicate entries
   */
  existingEmailInProject: [RegExp] = [new RegExp('anEmptyRegularExpressionWasntPossible')];

  /**
   * selected user object
   */
  selectedUser: ReadUser;

  /**
   * member status of selected user
   */
  isAlreadyMember = false;

  /**
   * iri of the project; used for API requests
   */
  projectIri: string;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _dialog: MatDialog,
    private _formBuilder: UntypedFormBuilder,
    private _projectService: ProjectService,
    private _store: Store,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.projectIri = this._projectService.uuidToIri(this.projectUuid);
    // build the form
    this.buildForm();
  }

  buildForm(): void {
    // clean autocomplete list
    this.users = [];

    // get all users
    this._dspApiConnection.admin.usersEndpoint.getUsers().subscribe((response: ApiResponseData<UsersResponse>) => {
      // if a user is already member of the team, mark it in the list
      const members: string[] = [];

      // get all members of this project
      const projectMembers = this._store.selectSnapshot(ProjectsSelectors.projectMembers);
      if (projectMembers[this.projectIri]) {
        for (const m of projectMembers[this.projectIri].value) {
          members.push(m.id);

          // if the user is already member of the project
          // add the email to the list of existing
          this.existingEmailInProject.push(new RegExp(`(?:^|W)${m.email.toLowerCase()}(?:$|W)`));
          // add username to the list of existing
          this.existingUsernameInProject.push(new RegExp(`(?:^|W)${m.username.toLowerCase()}(?:$|W)`));
        }
      }

      let i = 0;
      for (const u of response.body.users.filter(user => user.username.length > 0)) {
        // if the user is already member of the project
        // add the email to the list of existing
        this.existingEmails.push(new RegExp(`(?:^|W)${u.email.toLowerCase()}(?:$|W)`));
        // add username to the list of existing
        this.existingUsernames.push(new RegExp(`(?:^|W)${u.username.toLowerCase()}(?:$|W)`));

        let existsInProject = '';

        if (members && members.indexOf(u.id) > -1) {
          existsInProject = '* ';
        }

        let usernameLabel = existsInProject + u.username;
        if (usernameLabel.length > 0) {
          usernameLabel += ' | ';
        }

        let emailLabel = u.email;
        if (emailLabel.length > 0) {
          emailLabel += ' | ';
        }

        this.users[i] = {
          iri: u.id,
          name: u.username,
          label: `${usernameLabel} ${emailLabel} ${u.givenName} ${u.familyName}`,
        };
        i++;
      }

      this.users.sort((u1: AutocompleteItem, u2: AutocompleteItem) => {
        if (u1.label < u2.label) {
          return -1;
        } else if (u1.label > u2.label) {
          return 1;
        } else {
          return 0;
        }
      });

      this.loading = false;
      this._cd.markForCheck();
    });

    this.selectUserForm = this._formBuilder.group({
      username: new UntypedFormControl(
        {
          value: '',
          disabled: false,
        },
        [
          existingNamesValidator(this.existingUsernames),
          existingNamesValidator(this.existingUsernameInProject),
          existingNamesValidator(this.existingEmails),
          existingNamesValidator(this.existingEmailInProject),
        ]
      ),
    });

    this.filteredUsers$ = this.selectUserForm.controls['username'].valueChanges.pipe(
      startWith(''),
      map(user => (user.length >= 2 ? this.filter(this.users, user) : []))
    );

    this.selectUserForm.valueChanges.subscribe(() => this.onValueChanged());

    this.onValueChanged(); // (re)set validation messages now
  }

  /**
   * filter a list while typing in auto complete input field
   * @param list List of options
   * @param name Value to filter by
   * @returns Filtered list of options
   */
  filter(list: AutocompleteItem[], name: string) {
    return list.filter(user => user.label.toLowerCase().includes(name.toLowerCase()));
  }

  /**
   * set the error messages on value changed
   */
  onValueChanged() {
    if (!this.selectUserForm) {
      return;
    }

    // reset selected user
    this.selectedUser = undefined;

    // check if the form is valid
    Object.keys(this.selectUserErrors).forEach(field => {
      this.selectUserErrors[field] = '';
      const control = this.selectUserForm.get(field);
      if (control.value.length >= 2) {
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          Object.keys(control.errors).forEach(key => {
            this.selectUserErrors[field] += `${messages[key]} `;
          });
        }
      }
    });
  }

  /**
   * add user to the project
   *
   * @param val The value can be e-mail address or username
   */
  addUser(val: string) {
    // --> TODO add getUserByEmail
    // you can type username or email. We have to check, what we have now
    this._dspApiConnection.admin.usersEndpoint.getUserByUsername(val).subscribe(
      (response: ApiResponseData<UserResponse>) => {
        // case b) result if the user exists
        this.selectedUser = response.body.user;

        // the following request should never start
        this.isAlreadyMember = !!response.body.user.projects.find(p => p.id === this.projectIri);

        if (!this.isAlreadyMember) {
          this.loading = true;

          // add user to project
          this._dspApiConnection.admin.usersEndpoint
            .addUserToProjectMembership(this.selectedUser.id, this.projectIri)
            .subscribe(() => {
              // successful post
              // reload the component
              this.buildForm();
              this.refreshParent.emit();

              this.loading = false;
            });
        }
      },
      (error: ApiResponseError) => {
        if (error.status === 404) {
          // case c) user doesn't exist
          // create new user user-profile
          this.selectedUser = new ReadUser();

          this.selectedUser.email = val;
        }
      }
    );
  }

  createUser() {
    const dialogConfig = DspDialogConfig.dialogDrawerConfig<string>(this.projectUuid);
    this._dialog.open(CreateUserPageComponent, dialogConfig);
  }

  resetInput(ev: Event) {
    ev.preventDefault();
    this.selectUserForm.controls['username'].reset('');
  }

  trackByFn = (index: number, item: AutocompleteItem) => `${index}-${item.label}`;
}
