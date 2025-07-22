import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { combineLatest, map } from 'rxjs';
import { UsersTabService } from './users-tab.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users-tab',
  template: `
    <app-progress-indicator-overlay *ngIf="usersTabService.isLoading" />

    <ng-container *ngIf="users$ | async as users">
      <div style="display: flex; justify-content: center; margin: 16px 0">
        <app-double-chip-selector
          [options]="['Active users (' + users[0].length + ')', 'Inactive users (' + users[1].length + ')']"
          [(value)]="showActiveUsers" />
      </div>

      <app-users-list
        *ngIf="showActiveUsers && users[0] as activeUsers"
        [list]="activeUsers"
        [isButtonEnabledToCreateNewUser]="true" />

      <app-users-list *ngIf="!showActiveUsers && users[1] as inactiveUsers" [list]="inactiveUsers" />
    </ng-container>
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
