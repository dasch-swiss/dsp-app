import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { UserSelectors } from '@dasch-swiss/vre/core/state';
import { Store } from '@ngxs/store';
import { Subject, takeUntil, takeWhile } from 'rxjs';
import { EditUserDialogComponent, EditUserDialogProps } from '../edit-user-page/edit-user-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  isSysAdmin$ = this._store.select(UserSelectors.isSysAdmin);
  user$ = this._store.select(UserSelectors.user);
  isLoading$ = this._store.select(UserSelectors.isLoading);

  constructor(
    private _dialog: MatDialog,
    private _store: Store,
    private _titleService: Title
  ) {}

  ngOnInit() {
    this.user$
      .pipe(
        takeUntil(this.ngUnsubscribe),
        takeWhile(user => user !== null)
      )
      .subscribe(user => this._titleService.setTitle(`${user.username} (${user.givenName} ${user.familyName})`));
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  editProfile(user: ReadUser) {
    this._dialog.open<EditUserDialogComponent, EditUserDialogProps>(
      EditUserDialogComponent,
      DspDialogConfig.dialogDrawerConfig({ user }, true)
    );
  }
}
