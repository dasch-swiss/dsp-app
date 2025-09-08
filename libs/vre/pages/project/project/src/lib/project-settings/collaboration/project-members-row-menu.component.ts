import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { PermissionsData } from '@dasch-swiss/dsp-js/src/models/admin/permissions-data';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminUsersApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { EditPasswordDialogComponent } from '@dasch-swiss/vre/pages/system/system';
import { EditUserDialogComponent, EditUserDialogProps } from '@dasch-swiss/vre/pages/user-settings/user';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { switchMap } from 'rxjs';
import { CollaborationPageService } from './collaboration-page.service';

@Component({
  selector: 'app-project-members-row-menu',
  template: `
    <button mat-icon-button [matMenuTriggerFor]="projectUserMenu" data-cy="user-menu">
      <mat-icon>more_horiz</mat-icon>
    </button>

    <mat-menu #projectUserMenu="matMenu" xPosition="before" class="menu">
      @if (!isProjectAdmin(user.permissions)) {
        <button mat-menu-item (click)="addProjectAdminMembership()">Add as project admin</button>
      }
      @if (isProjectAdmin(user.permissions)) {
        <button mat-menu-item (click)="removeProjectAdminMembership()">Remove as project admin</button>
      }
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
    private _userService: UserService,
    private _userApiService: UserApiService,
    private _router: Router,
    private _matDialog: MatDialog,
    private _dialog: DialogService,
    private _adminUsersApi: AdminUsersApiService,
    private _collaborationPageService: CollaborationPageService
  ) {}

  isProjectAdmin(permissions: PermissionsData): boolean {
    if (!permissions.groupsPerProject) {
      return false;
    }

    return ProjectService.IsMemberOfProjectAdminGroup(permissions.groupsPerProject, this.project?.id || '');
  }

  removeProjectAdminMembership(): void {
    const id = this.user.id;
    const currentUser = this._userService.currentUser;
    if (!currentUser) return;

    this._userApiService.removeFromProjectMembership(id, this.project.id, true).subscribe(response => {
      if (currentUser.id !== response.user.id) {
        this._refresh();
      } else {
        this._userService.reloadUser().subscribe(() => {
          const isSysAdmin = ProjectService.IsMemberOfSystemAdminGroup(currentUser.permissions?.groupsPerProject || {});
          if (isSysAdmin) {
            this._refresh();
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
    const currentUser = this._userService.currentUser;
    if (!currentUser) return;

    // false: user isn't project admin yet --> add admin rights
    this._userApiService.addToProjectMembership(id, this.project.id, true).subscribe(response => {
      if (currentUser.username !== response.user.username) {
        this._refresh();
      } else {
        this._userService.reloadUser().subscribe(() => {
          this._refresh();
        });
      }
    });
  }

  editUser(user: ReadUser) {
    this._matDialog
      .open<EditUserDialogComponent, EditUserDialogProps, boolean>(
        EditUserDialogComponent,
        DspDialogConfig.dialogDrawerConfig<EditUserDialogProps>({ user }, true)
      )
      .afterClosed()
      .subscribe(success => {
        if (success) {
          this._refresh();
        }
      });
  }

  openEditPasswordDialog(user: ReadUser) {
    this._matDialog.open(EditPasswordDialogComponent, DspDialogConfig.dialogDrawerConfig({ user }, true));
  }

  askToRemoveFromProject(user: ReadUser) {
    this._dialog
      .afterConfirmation('Do you want to remove this user from the project?')
      .pipe(
        switchMap(() =>
          this._adminUsersApi.deleteAdminUsersIriUseririProjectMembershipsProjectiri(user.id, this.project.id)
        )
      )
      .subscribe(() => {
        this._refresh();
      });
  }

  private _refresh() {
    this._collaborationPageService.reloadProjectMembers();
  }
}
