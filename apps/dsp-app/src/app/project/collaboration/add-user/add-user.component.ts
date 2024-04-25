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
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn } from '@angular/forms';
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
import { CreateUserPageComponent } from '../../../user/create-user-page/create-user-page.component';
import { AutocompleteItem } from '../../../workspace/search/operator';

/**
 * validation of existing name values. Array method (list of values)
 * Use it in a "formbuilder" group as a validator property
 *
 * @param {RegExp} valArrayRegexp List of regular expression values
 * @returns ValidatorFn
 */
function existingUserNamesValidator(valArrayRegexp: [RegExp]): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } => {
    let name: string;

    if (control.value?.iri) {
      name = control.value.name.toLowerCase();
    } else if (control.value) {
      name = control.value.toLowerCase();
    }

    let no: boolean;
    for (const existing of valArrayRegexp) {
      no = existing.test(name);
      if (no) {
        return no ? { existingName: { name } } : null;
      }
    }
    return no ? { existingName: { name } } : null;
  };
}

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
   * form group
   */
  selectUserForm: UntypedFormGroup;

  /**
   * form errors
   */
  selectUserErrors = {
    addUser: '',
  };

  /**
   * form error hints
   */
  validationMessages = {
    addUser: {
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
  selectedUser: ReadUser;
  isAlreadyMember = false;
  projectIri: string;
  loading = true;

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
      this.setSelectUserForm(response.body.users);
    });
  }

  /**
   * filter a list while typing in auto complete input field
   * @param list List of options
   * @param name Value to filter by
   * @returns Filtered list of options
   */
  filter(list: AutocompleteItem[], name: string) {
    return list.filter(user => user?.name.toLowerCase().includes(name?.toLowerCase()));
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
      if (control.value.iri || control.value.length >= 2) {
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          Object.keys(control.errors).forEach(key => {
            this.selectUserErrors[field] += `${messages[key]} `;
          });
        }
      }
    });
  }

  addUser(item: AutocompleteItem) {
    if (this.selectUserForm.invalid) {
      return;
    }

    // you can type username or email. We have to check, what we have now
    this._dspApiConnection.admin.usersEndpoint.getUserByIri(item.iri).subscribe(
      (response: ApiResponseData<UserResponse>) => {
        // case b) result if the user exists
        this.selectedUser = response.body.user;
        this.isAlreadyMember = !!response.body.user.projects.find(p => p.id === this.projectIri);

        if (!this.isAlreadyMember) {
          this.loading = true;

          // add user to project
          this._dspApiConnection.admin.usersEndpoint
            .addUserToProjectMembership(this.selectedUser.id, this.projectIri)
            .subscribe(() => {
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

          this.selectedUser.givenName = item.name;
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
    this.selectUserForm.controls['addUser'].reset('');
  }

  /**
   * used to create a value which is displayed to the user after selection from autocomplete.
   *
   * @param item the user selected item.
   */
  displayWith(item: AutocompleteItem | null) {
    if (item) {
      return item.label;
    }
  }

  trackByFn = (index: number, item: AutocompleteItem) => `${index}-${item.label}`;

  private setSelectUserForm(users: ReadUser[]) {
    const existingNameInProject: [RegExp] = [new RegExp('anEmptyRegularExpressionWasntPossible')];
    const members: string[] = [];
    const projectMembers = this._store.selectSnapshot(ProjectsSelectors.projectMembers);
    if (projectMembers[this.projectIri]) {
      for (const m of projectMembers[this.projectIri].value) {
        members.push(m.id);
        existingNameInProject.push(
          new RegExp(`(?:^|W)${m.givenName.toLowerCase()}+\\s${m.familyName.toLowerCase()}(?:$|W)`)
        );
      }
    }

    this.users = users
      .map(user => {
        return {
          iri: user.id,
          name: `${user.givenName} ${user.familyName}`,
          label: this.getLabel(members, user),
        };
      })
      .sort((u1: AutocompleteItem, u2: AutocompleteItem) => {
        if (u1.label < u2.label) {
          return -1;
        } else if (u1.label > u2.label) {
          return 1;
        } else {
          return 0;
        }
      });

    this.selectUserForm = this._formBuilder.group({
      addUser: new UntypedFormControl(
        {
          value: '',
          disabled: false,
        },
        [existingUserNamesValidator(existingNameInProject)]
      ),
    });

    this.filteredUsers$ = this.selectUserForm.controls['addUser'].valueChanges.pipe(
      startWith(''),
      map(user => {
        if (user.name) {
          return user.name?.length >= 2 ? this.filter(this.users, user.name) : [];
        }
        return user.length >= 2 ? this.filter(this.users, user) : [];
      })
    );

    this.selectUserForm.valueChanges.subscribe(() => this.onValueChanged());

    this.onValueChanged(); // (re)set validation messages now

    this.loading = false;
    this._cd.markForCheck();
  }

  private getLabel(members: string[], user: ReadUser): string {
    let existsInProject = '';
    if (members && members.indexOf(user.id) > -1) {
      existsInProject = '* ';
    }
    let usernameLabel = '';
    let emailLabel = '';

    if (user.email && user.username) {
      usernameLabel = existsInProject + user.username;
      if (usernameLabel.length > 0) {
        usernameLabel += ' | ';
      }

      emailLabel = user.email;
      if (emailLabel.length > 0) {
        emailLabel += ' | ';
      }
    }

    return `${usernameLabel} ${emailLabel} ${user.givenName} ${user.familyName}`;
  }
}
