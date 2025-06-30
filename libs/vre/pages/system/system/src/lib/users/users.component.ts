import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { LoadUsersAction, ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/core/state';
import { Store } from '@ngxs/store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users',
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  activeUsers$ = this._store.select(UserSelectors.activeUsers);
  inactiveUsers$ = this._store.select(UserSelectors.inactiveUsers);
  isLoading$ = this._store.select(UserSelectors.usersLoading);
  project$ = this._store.select(ProjectsSelectors.currentProject);

  constructor(
    private readonly _store: Store,
    private readonly _titleService: Title
  ) {
    this._titleService.setTitle('All users in DSP');
  }

  ngOnInit() {
    this._store.dispatch(new LoadUsersAction());
  }
}
