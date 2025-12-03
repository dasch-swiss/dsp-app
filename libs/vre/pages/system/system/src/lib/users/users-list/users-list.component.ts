import { AsyncPipe, I18nPluralPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SortButtonComponent } from '../../sort-button/sort-button.component';
import { CreateUserDialogComponent } from '../create-user-dialog.component';
import { UsersTabService } from '../users-tab.service';
import { UsersListRowComponent } from './users-list-row.component';

interface SortProperty {
  key: keyof ReadUser;
  label: string;
}

type UserSortKey = 'familyName' | 'givenName' | 'email' | 'username';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users-list',
  template: `
    @if (list.length > 0) {
      <div>
        <div style="display: flex; align-items: center; padding: 16px; background-color: #f5f5f5">
          <span class="mat-headline-6" style="margin-bottom: 0; flex: 1" data-cy="user-count">
            {{ list.length | i18nPlural: itemPluralMapping['user'] }}
          </span>

          @if (isButtonEnabledToCreateNewUser && (isSysAdmin$ | async)) {
            <button mat-flat-button [color]="'primary'" (click)="createUser()" style="margin-right: 16px">
              {{ 'pages.system.usersList.createNewUser' | translate }}
            </button>
          }

          @if (list.length > 1) {
            <app-sort-button
              [icon]="'sort_by_alpha'"
              [sortProps]="sortProps"
              [activeKey]="sortBy"
              (sortKeyChange)="sortList($event)" />
          }
        </div>

        @for (user of list; track trackByFn($index, user)) {
          <app-users-list-row [user]="user" />
        }
      </div>
    }
  `,
  standalone: true,
  imports: [AsyncPipe, I18nPluralPipe, MatButton, SortButtonComponent, TranslateModule, UsersListRowComponent],
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
      '=1': `1 ${this._ts.instant('ui.common.entities.user')}`,
      other: `# ${this._ts.instant('ui.common.entities.users')}`,
    },
    member: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': `1 ${this._ts.instant('ui.common.entities.member')}`,
      other: `# ${this._ts.instant('ui.common.entities.members')}`,
    },
  };

  readonly sortProps: SortProperty[] = [
    {
      key: 'familyName',
      label: this._ts.instant('ui.common.fields.lastName'),
    },
    {
      key: 'givenName',
      label: this._ts.instant('ui.common.fields.firstName'),
    },
    {
      key: 'email',
      label: this._ts.instant('pages.system.usersList.sortEmail'),
    },
    {
      key: 'username',
      label: this._ts.instant('ui.common.fields.username'),
    },
  ];

  sortBy: UserSortKey = (localStorage.getItem('sortUsersBy') as UserSortKey) || 'username';
  isSysAdmin$ = this._userService.isSysAdmin$;

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _ts: TranslateService,
    private readonly _usersTabService: UsersTabService
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
