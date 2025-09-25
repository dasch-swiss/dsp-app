import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { AuthService, UserService } from '@dasch-swiss/vre/core/session';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { EditPasswordDialogComponent, EditPasswordDialogProps } from '../edit-password-dialog.component';
import { EditUserDialogComponent, EditUserDialogProps } from '../edit-user-page/edit-user-dialog.component';

@Component({
  selector: 'app-account',
  template: `
    @if (user$ | async; as user) {
      <div>
        <mat-card appearance="outlined" style="margin: 16px 0">
          <mat-list style="padding: 0">
            <mat-list-item (click)="onEditProfile(user)">
              <mat-icon matListItemIcon>person</mat-icon>
              <div matLine>Edit my profile</div>
            </mat-list-item>

            <mat-list-item (click)="onEditPassword(user)">
              <mat-icon matListItemIcon>lock</mat-icon>
              <div matLine>Edit my password</div>
            </mat-list-item>
          </mat-list>
        </mat-card>

        <h3>{{ 'pages.userSettings.account.danger' | translate }}</h3>

        <mat-card appearance="outlined">
          <mat-list style="padding: 0">
            <mat-list-item (click)="onDeleteOwnAccount(user)">
              <mat-icon matListItemIcon>warning</mat-icon>
              <div matLine>{{ 'pages.userSettings.account.deleteButton' | translate }}</div>
            </mat-list-item>
          </mat-list>
        </mat-card>
      </div>
    }
  `,
  styles: [
    `
      .mat-mdc-list-item {
        border-radius: 8px;
        transition: background-color 0.2s;
        &:hover {
          cursor: pointer;
          background-color: rgba(0, 0, 0, 0.04);
        }
      }
    `,
  ],
  standalone: false,
})
export class AccountComponent {
  user$ = this._userService.user$;

  constructor(
    private _userApiService: UserApiService,
    private _dialog: DialogService,
    private _matDialog: MatDialog,
    private _titleService: Title,
    private _userService: UserService,
    private _authService: AuthService
  ) {
    this._titleService.setTitle('Your account');
  }

  onEditProfile(user: ReadUser) {
    this._matDialog.open<EditUserDialogComponent, EditUserDialogProps>(
      EditUserDialogComponent,
      DspDialogConfig.dialogDrawerConfig({ user, isOwnAccount: true }, true)
    );
  }

  onEditPassword(user: ReadUser) {
    this._matDialog
      .open<
        EditPasswordDialogComponent,
        EditPasswordDialogProps,
        boolean
      >(EditPasswordDialogComponent, DspDialogConfig.dialogDrawerConfig({ user }, true))
      .afterClosed()
      .subscribe();
  }
  onDeleteOwnAccount(user: ReadUser) {
    this._dialog.afterConfirmation(`Do you want to suspend your own account?`).subscribe(() => {
      this._userApiService.delete(user.id).subscribe(() => {
        this._authService.logout();
      });
    });
  }
}
