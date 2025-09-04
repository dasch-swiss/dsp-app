import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
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

  isSysAdmin$ = this._userService.isSysAdmin$;
  user$ = this._userService.user$;

  constructor(
    private _dialog: MatDialog,
    private _userService: UserService,
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
