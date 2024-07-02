import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ApiResponseData, KnoraApiConnection, ReadUser } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, DspDialogConfig } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { LoadProjectMembersAction, ProjectsSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, startWith, take, takeUntil } from 'rxjs/operators';
import { CreateUserDialogComponent } from '../../../user/create-user-page/create-user-dialog.component';
import { AutocompleteItem } from '../../../workspace/search/operator';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
})
export class AddUserComponent implements OnInit, OnDestroy {
  @Input() projectUuid: string;

  private readonly _destroyed$: Subject<void> = new Subject<void>();
  selectUserForm: FormGroup;

  /**
   * list of all users
   */
  users: ReadUser[] = [];
  projectMembers: string[] = [];

  /**
   * filter users while typing (autocomplete)
   */
  filteredUsers$: Observable<ReadUser[]>;

  get projectIri(): string {
    return this._projectService.uuidToIri(this.projectUuid);
  }

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _dialog: MatDialog,
    private fb: FormBuilder,
    private _projectService: ProjectService,
    private _store: Store,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.selectUserForm = this.fb.group({
      addUser: new FormControl<ReadUser | null>(null),
    });

    combineLatest(
      this._dspApiConnection.admin.usersEndpoint.getUsers(),
      this._store.select(ProjectsSelectors.projectMembers)
    )
      .pipe(takeUntil(this._destroyed$))
      .subscribe(([response, projectMembers]) => {
        if (response && response instanceof ApiResponseData && projectMembers[this.projectIri]) {
          this.projectMembers = projectMembers[this.projectIri].value.map((member: ReadUser) => member.id);
          this._populateUserForm(response.body.users);
        }
      });
  }

  private _populateUserForm(users: ReadUser[]) {
    this.users = users.sort((u1: ReadUser, u2: ReadUser) => {
      if (this.fullName(u1) < this.fullName(u2)) {
        return -1;
      } else if (this.fullName(u1) > this.fullName(u2)) {
        return 1;
      } else {
        return 0;
      }
    });

    this.filteredUsers$ = this.selectUserForm.controls['addUser'].valueChanges.pipe(
      startWith(''), // initial empty string value for autocomplete to open on focus
      map((filterVal: string) => (filterVal ? this._filter(this.users, filterVal) : this.users))
    );
    this._cd.markForCheck();
  }

  private _filter(list: ReadUser[], filterVal: string) {
    return list.filter(user => this.fullName(user).toLowerCase().includes(filterVal.toLowerCase()));
  }

  getLabel(user: ReadUser): string {
    const usernameLabel = user.username ? `${user.username} | ` : '';
    const emailLabel = user.email ? `${user.email} | ` : '';
    return `${usernameLabel}${emailLabel}${user.givenName} ${user.familyName}`;
  }

  isMember(user: ReadUser): boolean {
    return this.projectMembers.includes(user.id);
  }

  fullName(user: ReadUser): string {
    return `${user.givenName} ${user.familyName}`;
  }

  addUser(userId: string) {
    this._dspApiConnection.admin.usersEndpoint
      .addUserToProjectMembership(userId, this.projectIri)
      .pipe(take(1))
      .subscribe(() => {
        this._store.dispatch(new LoadProjectMembersAction(this.projectUuid));
      });
    this.selectUserForm.controls['addUser'].reset('');
  }

  createUser() {
    const dialogConfig = DspDialogConfig.dialogDrawerConfig<string>(this.projectUuid);
    this._dialog.open(CreateUserDialogComponent, dialogConfig);
  }

  resetInput(ev: Event) {
    ev.preventDefault();
    this.selectUserForm.controls['addUser'].reset('');
  }

  trackByFn = (index: number, item: AutocompleteItem) => `${index}-${item.label}`;

  ngOnDestroy(): void {
    this._destroyed$.next();
    this._destroyed$.complete();
  }
}
