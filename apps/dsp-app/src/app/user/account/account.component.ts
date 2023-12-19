import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/shared/app-api';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';
import {
  LoadUserAction,
  UserSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
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
    private _dialog: MatDialog,
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

  openDialog(mode: string, name: string, id?: string): void {
    this._dialog
      .open(DialogComponent, {
        width: '560px',
        maxHeight: '80vh',
        position: {
          top: '112px',
        },
        data: { name: name, mode: mode },
      })
      .afterClosed()
      .subscribe(response => {
        if (response === true) {
          // get the mode
          switch (mode) {
            case 'deleteUser':
              this.deleteUser(id);
              break;

            case 'activateUser':
              this.activateUser(id);
              break;
          }
        } else {
          // update the view
          this.refreshParent.emit();
        }
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
