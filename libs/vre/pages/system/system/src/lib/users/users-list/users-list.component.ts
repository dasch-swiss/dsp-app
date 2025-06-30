import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Constants, ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { PermissionsData } from '@dasch-swiss/dsp-js/src/models/admin/permissions-data';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import {
  LoadProjectMembersAction,
  LoadProjectMembershipAction,
  LoadUserAction,
  ProjectsSelectors,
  RemoveUserFromProjectAction,
  SetUserAction,
  UserSelectors,
} from '@dasch-swiss/vre/core/state';
import { EditUserDialogComponent } from '@dasch-swiss/vre/pages/user-settings/user';
import { ProjectService, SortingService } from '@dasch-swiss/vre/shared/app-helper-services';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { combineLatest, from, merge, Subject } from 'rxjs';
import { filter, map, mergeMap, switchMap, take, takeLast, takeUntil } from 'rxjs/operators';
import { CreateUserDialogComponent } from '../create-user-dialog.component';
import { EditPasswordDialogComponent } from '../edit-password-dialog.component';
import { ManageProjectMembershipDialogComponent } from '../manage-project-membership-dialog.component';

interface SortProperty {
  key: keyof ReadUser;
  label: string;
}

type UserSortKey = 'familyName' | 'givenName' | 'email' | 'username';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit, OnDestroy {
  private readonly _destroy$ = new Subject<void>();
  @Input({ required: true }) status!: boolean;

  _list!: ReadUser[];
  get list(): ReadUser[] {
    return this._list;
  }

  @Input() set list(value: ReadUser[]) {
    this._list = this._sortingService.keySortByAlphabetical(value, this.sortBy as keyof ReadUser);
  }

  @Input() isButtonEnabledToCreateNewUser = false;
  @Input({ required: true }) project!: ReadProject;
  @Output() refreshParent = new EventEmitter<void>();

  // i18n plural mapping
  itemPluralMapping = {
    user: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': '1 User',
      other: '# Users',
    },
    member: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': '1 Member',
      other: '# Members',
    },
  };

  projectUuid!: string;

  sortProps: SortProperty[] = [
    {
      key: 'familyName',
      label: this._ts.instant('pages.system.usersList.sortFamilyName'),
    },
    {
      key: 'givenName',
      label: this._ts.instant('pages.system.usersList.sortGivenName'),
    },
    {
      key: 'email',
      label: 'E-mail',
    },
    {
      key: 'username',
      label: 'Username',
    },
  ];

  sortBy: UserSortKey = (localStorage.getItem('sortUsersBy') as UserSortKey) || 'username';

  isProjectOrSystemAdmin$ = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);
  isSysAdmin$ = this._store.select(UserSelectors.isSysAdmin);
  project$ = this._store.select(ProjectsSelectors.currentProject);
  username$ = this._store.select(UserSelectors.username);

  disableMenu$ = combineLatest([this.isProjectOrSystemAdmin$, this.isSysAdmin$]).pipe(
    map(
      ([isProjectAdmin, isSysAdmin]) =>
        this.project.status === false || (!isProjectAdmin && !isSysAdmin && !!this.projectUuid)
    )
  );

  constructor(
    private readonly _actions$: Actions,
    private readonly _dialog: DialogService,
    private readonly _matDialog: MatDialog,
    private readonly _router: Router,
    private readonly _sortingService: SortingService,
    private readonly _store: Store,
    private readonly _ts: TranslateService,
    private readonly _userApiService: UserApiService
  ) {}

  ngOnInit(): void {
    this.projectUuid = ProjectService.IriToUuid(this.project.id);
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  trackByFn = (index: number, item: ReadUser) => `${index}-${item.id}`;

  /**
   * Returns true, when the user is project admin.
   * If the parameter permissions is not set, it returns the value for the logged-in user
   */
  isProjectAdmin(permissions: PermissionsData): boolean {
    if (!permissions.groupsPerProject) {
      return false;
    }

    return ProjectService.IsMemberOfProjectAdminGroup(permissions.groupsPerProject, this.project.id);
  }

  /**
   * Returns true, if the user is system admin.
   */
  isSystemAdmin(permissions: PermissionsData): boolean {
    if (!permissions.groupsPerProject) {
      return false;
    }

    const groupsPerProjectKeys = Object.keys(permissions.groupsPerProject);

    return groupsPerProjectKeys.some(key => {
      if (key === Constants.SystemProjectIRI) {
        return permissions.groupsPerProject?.[key]?.includes(Constants.SystemAdminGroupIRI) ?? false;
      }
      return false;
    });
  }

  updateGroupsMembership(userIri: string, groups: string[]): void {
    if (!groups) {
      return;
    }

    const currentUserGroups: string[] = [];
    this._userApiService
      .getGroupMembershipsForUser(userIri)
      .pipe(takeUntil(this._destroy$))
      .subscribe(response => {
        for (const group of response.groups) {
          currentUserGroups.push(group.id);
        }

        const removeOldGroup$ = from(currentUserGroups).pipe(
          filter(oldGroup => groups.indexOf(oldGroup) === -1), // Filter out groups that are no longer in 'groups'
          mergeMap(oldGroup => this._userApiService.removeFromGroupMembership(userIri, oldGroup).pipe(take(1)))
        );

        const addNewGroup$ = from(groups).pipe(
          filter(newGroup => currentUserGroups.indexOf(newGroup) === -1), // Filter out groups that are already in 'currentUserGroups'
          mergeMap(newGroup => this._userApiService.addToGroupMembership(userIri, newGroup).pipe(take(1)))
        );

        merge(removeOldGroup$, addNewGroup$)
          .pipe(takeLast(1), takeUntil(this._destroy$))
          .subscribe(() => {
            if (this.projectUuid) {
              this._store.dispatch(new LoadProjectMembershipAction(this.projectUuid));
            }
          });
      });
  }

  updateProjectAdminMembership(id: string, permissions: PermissionsData): void {
    const currentUser = this._store.selectSnapshot(UserSelectors.user);
    if (!currentUser) return;

    if (this.isProjectAdmin(permissions)) {
      // true = user is already project admin --> remove from admin rights
      this._userApiService
        .removeFromProjectMembership(id, this.project.id, true)
        .pipe(takeUntil(this._destroy$))
        .subscribe(response => {
          // if this user is not the logged-in user
          if (currentUser.username !== response.user.username) {
            this._store.dispatch(new SetUserAction(response.user));
            this.refreshParent.emit();
          } else {
            // the logged-in user removed himself as project admin
            // the list is not available anymore;
            // open dialog to confirm and
            // redirect to project page
            // update the application state of logged-in user and the session
            this._store.dispatch(new LoadUserAction(currentUser.username));
            this._actions$
              .pipe(ofActionSuccessful(LoadUserAction), take(1), takeUntil(this._destroy$))
              .subscribe(() => {
                const isSysAdmin = ProjectService.IsMemberOfSystemAdminGroup(
                  currentUser.permissions?.groupsPerProject || {}
                );
                if (isSysAdmin) {
                  this.refreshParent.emit();
                } else {
                  // logged-in user is NOT system admin:
                  // go to project page and reload project admin interface
                  this._router
                    .navigateByUrl(RouteConstants.refreshRelative, {
                      skipLocationChange: true,
                    })
                    .then(() => this._router.navigate([`${RouteConstants.projectRelative}/${this.projectUuid}`]));
                }
              });
          }
        });
    } else {
      // false: user isn't project admin yet --> add admin rights
      this._userApiService
        .addToProjectMembership(id, this.project.id, true)
        .pipe(takeUntil(this._destroy$))
        .subscribe(response => {
          if (currentUser.username !== response.user.username) {
            this._store.dispatch(new SetUserAction(response.user));
            this.refreshParent.emit();
          } else {
            // the logged-in user (system admin) added himself as project admin
            // update the application state of logged-in user and the session
            this._store.dispatch(new LoadUserAction(currentUser.username));
            this._actions$
              .pipe(ofActionSuccessful(LoadUserAction), take(1), takeUntil(this._destroy$))
              .subscribe(() => {
                this.refreshParent.emit();
              });
          }
        });
    }
  }

  updateSystemAdminMembership(user: ReadUser, systemAdmin: boolean): void {
    this._userApiService
      .updateSystemAdminMembership(user.id, systemAdmin)
      .pipe(take(1), takeUntil(this._destroy$))
      .subscribe(response => {
        this._store.dispatch(new SetUserAction(response.user));
        if (this._store.selectSnapshot(UserSelectors.username) !== user.username) {
          this.refreshParent.emit();
        }
      });
  }

  askToActivateUser(username: string, id: string) {
    this._dialog
      .afterConfirmation(`Do you want to reactivate user ${username}?`)
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this.activateUser(id);
      });
  }

  askToDeactivateUser(username: string, id: string) {
    this._dialog
      .afterConfirmation(`Do you want to suspend user ${username}?`)
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this.deactivateUser(id);
      });
  }

  askToRemoveFromProject(user: ReadUser) {
    this._dialog
      .afterConfirmation('Do you want to remove this user from the project?')
      .pipe(
        switchMap(() => {
          this._store.dispatch(new RemoveUserFromProjectAction(user.id, this.project.id));
          return this._actions$.pipe(ofActionSuccessful(LoadProjectMembersAction));
        }),
        takeUntil(this._destroy$)
      )
      .subscribe();
  }

  createUser() {
    const dialogRef = this._matDialog.open(CreateUserDialogComponent, DspDialogConfig.dialogDrawerConfig({}, true));
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this.refreshParent.emit();
      });
  }

  editUser(user: ReadUser) {
    const dialogConfig = DspDialogConfig.dialogDrawerConfig<ReadUser>(user, true);
    const dialogRef = this._matDialog.open(EditUserDialogComponent, dialogConfig);
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this.refreshParent.emit();
      });
  }

  openEditPasswordDialog(user: ReadUser) {
    this._matDialog
      .open(EditPasswordDialogComponent, DspDialogConfig.dialogDrawerConfig({ user }, true))
      .afterClosed()
      .pipe(takeUntil(this._destroy$))
      .subscribe(response => {
        if (response === true) {
          this.refreshParent.emit();
        }
      });
  }

  openManageProjectMembershipDialog(user: ReadUser): void {
    this._matDialog.open(ManageProjectMembershipDialogComponent, DspDialogConfig.dialogDrawerConfig({ user }, true));
  }

  sortList(key: UserSortKey) {
    this.sortBy = key;
    this.list = this._sortingService.keySortByAlphabetical(this.list, this.sortBy);
    localStorage.setItem('sortUsersBy', key);
  }

  private deactivateUser(userIri: string) {
    this._userApiService
      .delete(userIri)
      .pipe(take(1), takeUntil(this._destroy$))
      .subscribe(response => {
        this._store.dispatch(new SetUserAction(response.user));
        this.refreshParent.emit();
      });
  }

  private activateUser(userIri: string) {
    this._userApiService
      .updateStatus(userIri, true)
      .pipe(take(1), takeUntil(this._destroy$))
      .subscribe(response => {
        this._store.dispatch(new SetUserAction(response.user));
        this.refreshParent.emit();
      });
  }
}
