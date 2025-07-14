import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { PermissionsData } from '@dasch-swiss/dsp-js/src/models/admin/permissions-data';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import { LoadUserAction, RemoveUserFromProjectAction, SetUserAction, UserSelectors } from '@dasch-swiss/vre/core/state';
import { EditPasswordDialogComponent } from '@dasch-swiss/vre/pages/system/system';
import { EditUserDialogComponent } from '@dasch-swiss/vre/pages/user-settings/user';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-project-members-row-menu',
  template: `
    <button mat-icon-button [matMenuTriggerFor]="projectUserMenu" data-cy="user-menu">
      <mat-icon>more_horiz</mat-icon>
    </button>

    <mat-menu #projectUserMenu="matMenu" xPosition="before" class="menu">
      <button mat-menu-item *ngIf="!isProjectAdmin(user.permissions)" (click)="addProjectAdminMembership()">
        Add as project admin
      </button>
      <button mat-menu-item *ngIf="isProjectAdmin(user.permissions)" (click)="removeProjectAdminMembership()">
        Remove as project admin
      </button>
      <button mat-menu-item (click)="editUser(user)">Edit member</button>
      <button mat-menu-item (click)="openEditPasswordDialog(user)">Change member's password</button>
      <button mat-menu-item (click)="askToRemoveFromProject(user)" data-cy="remove-member-button">
        Remove member from project
      </button>
    </mat-menu>
  `,
})
export class ProjectMembersRowMenuComponent {
  @Input({ required: true }) user!: ReadUser;
  @Input({ required: true }) project!: ReadProject;
  @Output() refreshParent = new EventEmitter<void>();

  constructor(
    private _store: Store,
    private _userApiService: UserApiService,
    private _router: Router,
    private _matDialog: MatDialog,
    private _dialog: DialogService
  ) {}

  isProjectAdmin(permissions: PermissionsData): boolean {
    if (!permissions.groupsPerProject) {
      return false;
    }

    return ProjectService.IsMemberOfProjectAdminGroup(permissions.groupsPerProject, this.project?.id || '');
  }

  removeProjectAdminMembership(): void {
    const id = this.user.id;
    const currentUser = this._store.selectSnapshot(UserSelectors.user);
    if (!currentUser) return;

    this._userApiService.removeFromProjectMembership(id, this.project.id, true).subscribe(response => {
      if (currentUser.username !== response.user.username) {
        this._store.dispatch(new SetUserAction(response.user));
        this.refresh();
      } else {
        this._store.dispatch(new LoadUserAction(currentUser.username)).subscribe(() => {
          const isSysAdmin = ProjectService.IsMemberOfSystemAdminGroup(currentUser.permissions?.groupsPerProject || {});
          if (isSysAdmin) {
            this.refresh();
          } else {
            this._router
              .navigateByUrl(RouteConstants.refreshRelative, {
                skipLocationChange: true,
              })
              .then(() => this._router.navigate([`${RouteConstants.projectRelative}/${this.project.id}`]));
          }
        });
      }
    });
  }

  addProjectAdminMembership(): void {
    const id = this.user.id;
    const currentUser = this._store.selectSnapshot(UserSelectors.user);
    if (!currentUser) return;

    // false: user isn't project admin yet --> add admin rights
    this._userApiService.addToProjectMembership(id, this.project.id, true).subscribe(response => {
      if (currentUser.username !== response.user.username) {
        this._store.dispatch(new SetUserAction(response.user));
        this.refresh();
      } else {
        // the logged-in user (system admin) added himself as project admin
        // update the application state of logged-in user and the session
        this._store.dispatch(new LoadUserAction(currentUser.username)).subscribe(() => {
          this.refresh();
        });
      }
    });
  }

  editUser(user: ReadUser) {
    this._matDialog
      .open(EditUserDialogComponent, DspDialogConfig.dialogDrawerConfig<ReadUser>(user, true))
      .afterClosed()
      .subscribe(() => {
        this.refresh();
      });
  }

  openEditPasswordDialog(user: ReadUser) {
    this._matDialog
      .open(EditPasswordDialogComponent, DspDialogConfig.dialogDrawerConfig({ user }, true))
      .afterClosed()
      .subscribe(response => {
        if (response === true) {
          this.refresh();
        }
      });
  }

  askToRemoveFromProject(user: ReadUser) {
    this._dialog.afterConfirmation('Do you want to remove this user from the project?').subscribe(() => {
      this._store.dispatch(new RemoveUserFromProjectAction(user.id, this.project.id));
    });
  }

  refresh() {
    (window as any).location.reload(); // TODO change later on with a service reloading users.
  }
}
