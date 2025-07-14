import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/core/state';
import { SortingService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngxs/store';
import { CreateUserDialogComponent } from '../create-user-dialog.component';

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
  get list(): ReadUser[] {
    return this._list;
  }

  @Input() set list(value: ReadUser[]) {
    this._list = this._sortingService.keySortByAlphabetical(value, this.sortBy as keyof ReadUser);
  }

  @Input() isButtonEnabledToCreateNewUser = false;
  @Output() refreshParent = new EventEmitter<void>();

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
  isSysAdmin$ = this._store.select(UserSelectors.isSysAdmin);
  project$ = this._store.select(ProjectsSelectors.currentProject);

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _sortingService: SortingService,
    private readonly _store: Store,
    private readonly _ts: TranslateService
  ) {}

  trackByFn = (index: number, item: ReadUser) => `${index}-${item.id}`;

  createUser() {
    this._matDialog
      .open(CreateUserDialogComponent, DspDialogConfig.dialogDrawerConfig({}, true))
      .afterClosed()
      .subscribe(() => {
        this.refreshParent.emit();
      });
  }

  sortList(key: UserSortKey) {
    this.sortBy = key;
    this.list = this._sortingService.keySortByAlphabetical(this.list, this.sortBy);
    localStorage.setItem('sortUsersBy', key);
  }
}
