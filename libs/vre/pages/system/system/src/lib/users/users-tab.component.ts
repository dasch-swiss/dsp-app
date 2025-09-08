import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { combineLatest, map } from 'rxjs';
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
          [options]="['Active users (' + users[0].length + ')', 'Inactive users (' + users[1].length + ')']"
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
})
export class UsersTabComponent {
  private _activeUsers$ = this.usersTabService.allUsers$.pipe(map(users => users.filter(user => user.status)));
  private _inactiveUsers$ = this.usersTabService.allUsers$.pipe(map(users => users.filter(user => !user.status)));

  users$ = combineLatest([this._activeUsers$, this._inactiveUsers$]);
  showActiveUsers = true;

  constructor(
    private readonly _titleService: Title,
    public usersTabService: UsersTabService
  ) {
    this._titleService.setTitle('All users in DSP');
  }
}
