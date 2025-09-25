import { Component, Input } from '@angular/core';
import { Constants, ReadUser } from '@dasch-swiss/dsp-js';
import { PermissionsData } from '@dasch-swiss/dsp-js/src/models/admin/permissions-data';

@Component({
  selector: 'app-users-list-row',
  template: `<span style="display: flex">
    <app-user-description [user]="user" style="flex: 1" />

    @if (isSystemAdmin(user.permissions)) {
      <mat-chip-set style="padding: 0 16px">
        <mat-chip [disableRipple]="true">
          <mat-icon matChipAvatar style="color: #856404">verified_user</mat-icon>
          {{ 'pages.userSettings.profile.systemAdmin' | translate }}
        </mat-chip>
      </mat-chip-set>
    }

    <app-users-list-row-menu [user]="user" />
  </span>`,
  styles: [
    `
      :host {
        display: block;
        padding: 16px;

        &:hover {
          background: #d6e0e8;
        }
      }
    `,
  ],
  standalone: false,
})
export class UsersListRowComponent {
  @Input({ required: true }) user!: ReadUser;

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
}
