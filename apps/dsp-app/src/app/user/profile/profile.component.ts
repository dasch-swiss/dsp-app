import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/shared/app-config';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';
import { EditUserPageComponent } from '../edit-user-page/edit-user-page.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  @Input() loggedInUser?: boolean = false;

  @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;
  @Select(UserSelectors.user) user$: Observable<ReadUser>;
  @Select(UserSelectors.isLoading) isLoading$: Observable<boolean>;

  constructor(
    private _dialog: MatDialog,
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
    const dialogConfig = DspDialogConfig.dialogDrawerConfig<ReadUser>(user);
    this._dialog.open(EditUserPageComponent, dialogConfig);
  }
}
