import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateService } from '@ngx-translate/core';
import { CreateUserDialogComponent } from '../create-user-dialog.component';
import { UsersTabService } from '../users-tab.service';

interface SortProperty {
  key: keyof ReadUser;
  label: string;
}

type UserSortKey = 'familyName' | 'givenName' | 'email' | 'username';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users-list',
  template: `
    <div *ngIf="list.length > 0">
      <div style="display: flex; align-items: center; padding: 16px; background-color: #f5f5f5">
        <span class="mat-headline-6" style="margin-bottom: 0; flex: 1" data-cy="user-count">
          {{ list.length | i18nPlural: itemPluralMapping['user'] }}
        </span>
        <button
          mat-flat-button
          [color]="'primary'"
          (click)="createUser()"
          *ngIf="isButtonEnabledToCreateNewUser && (isSysAdmin$ | async)"
          style="margin-right: 16px">
          Create new
        </button>

        <app-sort-button
          *ngIf="list.length > 1"
          [icon]="'sort_by_alpha'"
          [sortProps]="sortProps"
          [activeKey]="sortBy"
          (sortKeyChange)="sortList($event)" />
      </div>

      <app-users-list-row [user]="user" *ngFor="let user of list; trackBy: trackByFn" />
    </div>
  `,
})
export class UsersListComponent {
  _list!: ReadUser[];
  @Input() set list(value: ReadUser[]) {
    this._list = SortingHelper.keySortByAlphabetical(value, this.sortBy as keyof ReadUser);
  }

  get list(): ReadUser[] {
    return this._list;
  }

  @Input() isButtonEnabledToCreateNewUser = false;

  itemPluralMapping = {
    user: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': '1 User',
      other: '# Users',
    },
    member: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': '1 Member',
      other: '# Members',
    },
  };

  readonly sortProps: SortProperty[] = [
    {
      key: 'familyName',
      label: this._ts.instant('pages.system.usersList.sortFamilyName'),
    },
    {
      key: 'givenName',
      label: this._ts.instant('pages.system.usersList.sortGivenName'),
    },
    {
      key: 'email',
      label: 'E-mail',
    },
    {
      key: 'username',
      label: 'Username',
    },
  ];

  sortBy: UserSortKey = (localStorage.getItem('sortUsersBy') as UserSortKey) || 'username';
  isSysAdmin$ = this._userService.isSysAdmin$;

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _ts: TranslateService,
    private _usersTabService: UsersTabService
  ) {}

  trackByFn = (index: number, item: ReadUser) => `${index}-${item.id}`;

  createUser() {
    this._matDialog
      .open<CreateUserDialogComponent, undefined, boolean>(
        CreateUserDialogComponent,
        DspDialogConfig.dialogDrawerConfig(undefined, true)
      )
      .afterClosed()
      .subscribe(isCreated => {
        if (isCreated) {
          this._usersTabService.reloadUsers();
        }
      });
  }

  sortList(key: UserSortKey) {
    this.sortBy = key;
    this.list = SortingHelper.keySortByAlphabetical(this.list, this.sortBy);
    localStorage.setItem('sortUsersBy', key);
  }
}
