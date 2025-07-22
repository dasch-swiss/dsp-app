import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadUser } from '@dasch-swiss/dsp-js';
import { PermissionsData } from '@dasch-swiss/dsp-js/src/models/admin/permissions-data';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { SetUserAction, UserSelectors } from '@dasch-swiss/vre/core/state';
import { EditUserDialogComponent, EditUserDialogProps } from '@dasch-swiss/vre/pages/user-settings/user';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { Store } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { EditPasswordDialogComponent, EditPasswordDialogProps } from '../edit-password-dialog.component';
import { ManageProjectMembershipDialogComponent } from '../manage-project-membership-dialog.component';
import { UsersTabService } from '../users-tab.service';

@Component({
  selector: 'app-users-list-row-menu',
  template: `
    <button mat-icon-button *ngIf="isSysAdmin$ | async" [matMenuTriggerFor]="projectUserMenu" data-cy="user-menu">
      <mat-icon>more_horiz</mat-icon>
    </button>

    <mat-menu #projectUserMenu="matMenu" xPosition="before">
      <button
        mat-menu-item
        *ngIf="user.username !== (username$ | async)"
        (click)="updateSystemAdminMembership(user, !isSystemAdmin(user.permissions))">
        {{ isSystemAdmin(user.permissions) ? 'Remove' : 'Add' }} as system admin
      </button>

      <ng-container *ngIf="user.status">
        <button mat-menu-item (click)="editUser(user)">Edit user</button>
        <button mat-menu-item (click)="openEditPasswordDialog(user)">Change user's password</button>
        <button mat-menu-item (click)="openManageProjectMembershipDialog(user)">Manage project membership</button>
        <button mat-menu-item (click)="askToDeactivateUser(user.username, user.id)">Suspend user</button>
      </ng-container>

      <button mat-menu-item *ngIf="!user.status" (click)="askToActivateUser(user.username, user.id)">
        Reactivate user
      </button>
    </mat-menu>
  `,
})
export class UsersListRowMenuComponent {
  @Input({ required: true }) user!: ReadUser;

  isSysAdmin$ = this._store.select(UserSelectors.isSysAdmin);
  username$ = this._store.select(UserSelectors.username);

  constructor(
    private _matDialog: MatDialog,
    private _store: Store,
    private _dialog: DialogService,
    private readonly _userApiService: UserApiService,
    private _usersTabService: UsersTabService
  ) {}

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

  updateSystemAdminMembership(user: ReadUser, systemAdmin: boolean): void {
    this._userApiService
      .updateSystemAdminMembership(user.id, systemAdmin)
      .pipe(take(1))
      .subscribe(response => {
        this._store.dispatch(new SetUserAction(response.user));
        if (this._store.selectSnapshot(UserSelectors.username) !== user.username) {
          this._reloadUserList();
        }
      });
  }

  askToActivateUser(username: string, id: string) {
    this._dialog.afterConfirmation(`Do you want to reactivate user ${username}?`).subscribe(() => {
      this.activateUser(id);
    });
  }

  askToDeactivateUser(username: string, id: string) {
    this._dialog.afterConfirmation(`Do you want to suspend user ${username}?`).subscribe(() => {
      this.deactivateUser(id);
    });
  }

  editUser(user: ReadUser) {
    this._matDialog
      .open<EditUserDialogComponent, EditUserDialogProps, boolean>(
        EditUserDialogComponent,
        DspDialogConfig.dialogDrawerConfig({ user }, true)
      )
      .afterClosed()
      .subscribe(success => {
        if (success) {
          this._reloadUserList();
        }
      });
  }

  openEditPasswordDialog(user: ReadUser) {
    this._matDialog
      .open<EditPasswordDialogComponent, EditPasswordDialogProps, boolean>(
        EditPasswordDialogComponent,
        DspDialogConfig.dialogDrawerConfig({ user }, true)
      )
      .afterClosed()
      .subscribe(success => {
        if (success) {
          this._reloadUserList();
        }
      });
  }

  openManageProjectMembershipDialog(user: ReadUser): void {
    this._matDialog.open(ManageProjectMembershipDialogComponent, DspDialogConfig.dialogDrawerConfig({ user }, true));
  }

  private deactivateUser(userIri: string) {
    this._userApiService.delete(userIri).subscribe(response => {
      this._store.dispatch(new SetUserAction(response.user));
      this._reloadUserList();
    });
  }

  private activateUser(userIri: string) {
    this._userApiService.updateStatus(userIri, true).subscribe(response => {
      this._store.dispatch(new SetUserAction(response.user));
      this._reloadUserList();
    });
  }

  private _reloadUserList() {
    this._usersTabService.reloadUsers();
  }
}
