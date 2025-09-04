import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AuthService, UserService } from '@dasch-swiss/vre/core/session';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { apiConnectionTokenProvider } from './api-connection-token.provider';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  providers: [apiConnectionTokenProvider],
})
export class AccountComponent {
  user$ = this._userService.user$;

  constructor(
    private _userApiService: UserApiService,
    private _dialog: DialogService,
    private _titleService: Title,
    private _userService: UserService,
    private _authService: AuthService
  ) {
    this._titleService.setTitle('Your account');
  }

  onDeleteOwnAccount(user: ReadUser) {
    this._dialog.afterConfirmation(`Do you want to suspend your own account?`).subscribe(() => {
      this._userApiService.delete(user.id).subscribe(() => {
        this._authService.logout();
      });
    });
  }
}
