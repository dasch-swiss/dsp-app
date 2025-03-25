import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AuthService } from '@dasch-swiss/vre/core/session';
import { LoadUserAction, UserSelectors } from '@dasch-swiss/vre/core/state';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { apiConnectionTokenProvider } from './api-connection-token.provider';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  providers: [apiConnectionTokenProvider],
})
export class AccountComponent implements OnInit {
  // in case of modification
  @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

  @Input() username: string;

  @Select(UserSelectors.user) user$: Observable<ReadUser>;
  @Select(UserSelectors.isLoading) isLoading$: Observable<boolean>;

  constructor(
    private _userApiService: UserApiService,
    private _dialog: DialogService,
    private _titleService: Title,
    private _store: Store,
    private _authService: AuthService
  ) {
    this._titleService.setTitle('Your account');
  }

  ngOnInit() {
    this._store.dispatch(new LoadUserAction(this.username));
  }

  askToActivateUser() {
    const user = this._store.selectSnapshot(UserSelectors.user);
    this._dialog.afterConfirmation(`Do you want to reactivate user ${user!.username}?`).subscribe(() => {
      this.activateUser(user!.id);
    });
  }

  askToDeleteUser() {
    const user = this._store.selectSnapshot(UserSelectors.user);
    this._dialog.afterConfirmation(`Do you want to suspend user ${user!.username}?`).subscribe(() => {
      this.deleteUser(user!.id);
    });
  }

  deleteUser(id: string) {
    this._userApiService.delete(id).subscribe(() => {
      this._authService.logout();
    });
  }

  activateUser(id: string) {
    this._userApiService.updateStatus(id, true).subscribe(() => {
      this.refreshParent.emit();
    });
  }
}
