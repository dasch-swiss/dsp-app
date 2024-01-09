import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/shared/app-api';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';
import { LoadUserAction, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DialogService } from '../../main/services/dialog.service';
import { apiConnectionTokenProvider } from '../../providers/api-connection-token.provider';

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

  userId = null;

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
    this._store.dispatch(new LoadUserAction(this.username)).pipe(
      tap((user: ReadUser) => {
        this.userId = user.id;
      })
    );
  }

  askToActivateUser(username: string, id: string) {
    this._dialog.afterConfirmation(`Do you want to reactivate user ${username}?`).subscribe(() => {
      this.activateUser(id);
    });
  }

  askToDeleteUser(username: string, id: string) {
    this._dialog.afterConfirmation(`Do you want to suspend user ${username}?`).subscribe(() => {
      this.deleteUser(id);
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
