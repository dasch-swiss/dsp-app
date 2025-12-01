import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ProgressIndicatorOverlayComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { DoubleChipSelectorComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';
import { UsersListComponent } from './users-list/users-list.component';
import { UsersTabService } from './users-tab.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users-tab',
  template: `
    @if (usersTabService.isLoading) {
      <app-progress-indicator-overlay />
    }

    @if (users$ | async; as users) {
      <div style="display: flex; justify-content: center; margin: 16px 0">
        <app-double-chip-selector
          [options]="[
            _translateService.instant('pages.system.activeUsersCount', { count: users[0].length }),
            _translateService.instant('pages.system.inactiveUsersCount', { count: users[1].length }),
          ]"
          [(value)]="showActiveUsers" />
      </div>
      @if (showActiveUsers && users[0]; as activeUsers) {
        <app-users-list [list]="activeUsers" [isButtonEnabledToCreateNewUser]="true" />
      }
      @if (!showActiveUsers && users[1]; as inactiveUsers) {
        <app-users-list [list]="inactiveUsers" />
      }
    }
  `,
  providers: [UsersTabService],
  standalone: true,
  imports: [AsyncPipe, DoubleChipSelectorComponent, ProgressIndicatorOverlayComponent, UsersListComponent],
})
export class UsersTabComponent {
  private readonly _titleService = inject(Title);
  public readonly usersTabService = inject(UsersTabService);
  public readonly _translateService = inject(TranslateService);

  private _activeUsers$ = this.usersTabService.allUsers$.pipe(map(users => users.filter(user => user.status)));
  private _inactiveUsers$ = this.usersTabService.allUsers$.pipe(map(users => users.filter(user => !user.status)));

  users$ = combineLatest([this._activeUsers$, this._inactiveUsers$]);
  showActiveUsers = true;

  constructor() {
    this._titleService.setTitle('All users in DSP');
  }
}
