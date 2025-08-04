import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AuthService } from '@dasch-swiss/vre/core/session';
import { UserSelectors } from '@dasch-swiss/vre/core/state';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { Store } from '@ngxs/store';
import { apiConnectionTokenProvider } from './api-connection-token.provider';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  providers: [apiConnectionTokenProvider],
})
export class AccountComponent {
  user$ = this._store.select(UserSelectors.user);
  isLoading$ = this._store.select(UserSelectors.isLoading);

  constructor(
    private _userApiService: UserApiService,
    private _dialog: DialogService,
    private _titleService: Title,
    private _store: Store,
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
